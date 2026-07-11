"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeviceId } from "@/lib/device";
import {
  acceptOnlineInvite,
  cancelOnlineInvite,
  createLivePresencePayload,
  createOnlineInvite,
  declineOnlineInvite,
  fetchIncomingInvites,
  fetchSentInvites,
  joinAcceptedOnlineInvite,
  subscribeToInviteChanges,
  subscribeToLivePresence,
  type LivePresenceSubscription,
  type OnlineGameInvite,
  type OnlinePresence,
  type PresenceConnectionState,
} from "@/lib/onlinePresence";
import { databasePresenceToUserLabel } from "@/lib/presencePreference";
import type { GameConfig } from "@/types/game";
import type { OnlineGameType, OnlinePlayer, OnlineRoomSnapshot } from "@/types/online";

interface OnlineAvailablePlayersProps {
  playerName: string;
  gameType: OnlineGameType;
  settings: GameConfig;
  currentRoomId?: string | null;
  onEnterRoom: (result: OnlineRoomSnapshot & { localPlayer: OnlinePlayer }, message: string) => void;
  onMessage: (message: string) => void;
}

const AVAILABILITY_KEY = "blink-and-find-available-to-play";
const INVITE_FALLBACK_REFRESH_MS = 30_000;

function loadAvailability() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(AVAILABILITY_KEY) !== "false";
}

function saveAvailability(value: boolean) {
  if (typeof window !== "undefined") window.localStorage.setItem(AVAILABILITY_KEY, value ? "true" : "false");
}

function shortDeviceId(deviceId: string) {
  return deviceId.slice(0, 8).toUpperCase();
}

function playerStatusLabel(player: OnlinePresence) {
  return databasePresenceToUserLabel(player.status, player.available_to_play);
}

function connectionMessage(state: PresenceConnectionState, playerCount: number) {
  if (state === "live") return `${playerCount} other active player${playerCount === 1 ? "" : "s"}`;
  if (state === "reconnecting") return "Reconnecting to live players...";
  if (state === "offline") return "Live presence is offline";
  return "Connecting to live players...";
}

export default function OnlineAvailablePlayers({ playerName, gameType, settings, currentRoomId = null, onEnterRoom, onMessage }: OnlineAvailablePlayersProps) {
  const deviceId = useMemo(() => getDeviceId(), []);
  const handledAcceptedInviteIds = useRef(new Set<string>());
  const presenceRef = useRef<LivePresenceSubscription | null>(null);
  const inviteRefreshInFlightRef = useRef(false);
  const [availableToPlay, setAvailableToPlay] = useState(loadAvailability);
  const [players, setPlayers] = useState<OnlinePresence[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<OnlineGameInvite[]>([]);
  const [sentInvites, setSentInvites] = useState<OnlineGameInvite[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const [connectionState, setConnectionState] = useState<PresenceConnectionState>("connecting");
  const [isBusy, setIsBusy] = useState(false);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);

  const isVisibleToOthers = availableToPlay && !currentRoomId && connectionState === "live";

  const enterAcceptedInvite = useCallback(async (invite: OnlineGameInvite) => {
    if (handledAcceptedInviteIds.current.has(invite.id)) return;
    if (!invite.room_code) {
      onMessage("Invite accepted. Waiting for the room to be ready...");
      return;
    }
    handledAcceptedInviteIds.current.add(invite.id);
    setIsBusy(true);
    onMessage(`${invite.to_name} accepted your invite. Opening room ${invite.room_code}...`);
    try {
      const result = await joinAcceptedOnlineInvite({ invite, playerName, deviceId });
      onEnterRoom(result, `${invite.to_name} accepted. You are both in room ${result.room.code}.`);
    } catch (error) {
      handledAcceptedInviteIds.current.delete(invite.id);
      onMessage(error instanceof Error ? error.message : "Could not open the accepted invite room.");
    } finally {
      setIsBusy(false);
    }
  }, [deviceId, onEnterRoom, onMessage, playerName]);

  const refreshInvites = useCallback(async () => {
    if (inviteRefreshInFlightRef.current) return;
    inviteRefreshInFlightRef.current = true;
    try {
      const [incomingResult, sentResult] = await Promise.all([fetchIncomingInvites(deviceId), fetchSentInvites(deviceId)]);
      setIncomingInvites(incomingResult.data);
      setSentInvites(sentResult.data);
      setUnavailable(incomingResult.unavailable || sentResult.unavailable);
      const acceptedInvite = sentResult.data.find((invite) => invite.status === "accepted" && invite.room_code);
      if (acceptedInvite) await enterAcceptedInvite(acceptedInvite);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Could not refresh invitations.");
    } finally {
      inviteRefreshInFlightRef.current = false;
    }
  }, [deviceId, enterAcceptedInvite, onMessage]);

  useEffect(() => {
    saveAvailability(availableToPlay);
  }, [availableToPlay]);

  useEffect(() => {
    const presence = subscribeToLivePresence({
      initialPayload: createLivePresencePayload({ deviceId, displayName: playerName, availableToPlay, currentRoomId }),
      onPlayers: setPlayers,
      onConnectionState: setConnectionState,
    });
    presenceRef.current = presence;
    const unsubscribeInvites = subscribeToInviteChanges(deviceId, () => void refreshInvites());
    void refreshInvites();
    const fallbackTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshInvites();
    }, INVITE_FALLBACK_REFRESH_MS);
    function refreshWhenVisible() {
      if (document.visibilityState === "visible") void refreshInvites();
    }
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(fallbackTimer);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      void unsubscribeInvites();
      void presence.cleanup();
      presenceRef.current = null;
    };
  }, [deviceId, refreshInvites]);

  useEffect(() => {
    void presenceRef.current?.update(createLivePresencePayload({ deviceId, displayName: playerName, availableToPlay, currentRoomId }));
  }, [availableToPlay, currentRoomId, deviceId, playerName]);

  function getIncomingInviteFrom(player: OnlinePresence) {
    return incomingInvites.find((invite) => invite.from_device_id === player.device_id && invite.status === "pending");
  }

  function getPendingInviteTo(player: OnlinePresence) {
    return sentInvites.find((invite) => invite.to_device_id === player.device_id && invite.status === "pending");
  }

  async function invitePlayer(player: OnlinePresence) {
    const incomingInvite = getIncomingInviteFrom(player);
    const pendingInvite = getPendingInviteTo(player);
    if (incomingInvite) return acceptInvite(incomingInvite);
    if (pendingInvite) {
      onMessage(`Invite already sent to ${player.display_name}.`);
      return;
    }
    if (!player.available_to_play || player.status !== "available") {
      onMessage(`${player.display_name} is ${playerStatusLabel(player).toLowerCase()} right now.`);
      return;
    }
    setIsBusy(true);
    onMessage(`Sending invite to ${player.display_name}...`);
    try {
      const result = await createOnlineInvite({ fromDeviceId: deviceId, fromName: playerName, toPlayer: player, gameType, settings });
      if (result.unavailable || !result.data) {
        setUnavailable(true);
        onMessage("Player invites need the latest Supabase migration.");
      } else if (result.data.from_device_id !== deviceId) {
        onMessage(`${player.display_name} already invited you. Accept their invite.`);
      } else {
        onMessage(`Invite sent to ${player.display_name}.`);
      }
      await refreshInvites();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Could not invite that player.");
    } finally {
      setIsBusy(false);
    }
  }

  async function acceptInvite(invite: OnlineGameInvite) {
    setIsBusy(true);
    setBusyInviteId(invite.id);
    onMessage(`Accepting ${invite.from_name}'s invite...`);
    try {
      const result = await acceptOnlineInvite({ invite, playerName, deviceId });
      onEnterRoom(result, `Accepted ${invite.from_name}'s invite. You are both in room ${result.room.code}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Could not accept invite.");
    } finally {
      setBusyInviteId(null);
      setIsBusy(false);
    }
  }

  async function declineInvite(invite: OnlineGameInvite) {
    setIsBusy(true);
    setBusyInviteId(invite.id);
    try {
      await declineOnlineInvite(invite.id);
      setIncomingInvites((current) => current.filter((item) => item.id !== invite.id));
      onMessage(`Declined ${invite.from_name}'s invite.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Could not decline invite.");
    } finally {
      setBusyInviteId(null);
      setIsBusy(false);
    }
  }

  async function cancelInvite(invite: OnlineGameInvite) {
    setIsBusy(true);
    setBusyInviteId(invite.id);
    try {
      await cancelOnlineInvite(invite);
      setSentInvites((current) => current.filter((item) => item.id !== invite.id));
      onMessage(`Cancelled invite to ${invite.to_name}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Could not cancel invite.");
    } finally {
      setBusyInviteId(null);
      setIsBusy(false);
    }
  }

  return (
    <Card className="overflow-hidden rounded-[1.5rem] border bg-muted/20">
      <CardHeader className="border-b pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle className="text-lg font-black">Live players</CardTitle><CardDescription>Updates instantly while this page is open, without database polling.</CardDescription></div>
          <Button size="sm" variant={availableToPlay ? "default" : "outline"} onClick={() => setAvailableToPlay((current) => !current)}>{availableToPlay ? "Available" : "Hidden"}</Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 p-3">
        <div className="grid gap-2 rounded-xl border bg-background/70 p-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-foreground">Connection</span><Badge variant={isVisibleToOthers ? "default" : "outline"}>{connectionState === "live" ? (isVisibleToOthers ? "Visible" : "Connected") : connectionState}</Badge></div>
          <div>{connectionMessage(connectionState, players.length)}</div>
          <div>This browser: <span className="font-mono text-foreground">{shortDeviceId(deviceId)}</span></div>
        </div>
        {unavailable && <div className="rounded-xl border bg-background/70 p-3 text-sm text-muted-foreground">Invitations need the latest Supabase migration.</div>}
        {incomingInvites.length > 0 && (
          <div className="grid gap-2 rounded-[1.25rem] border-2 border-primary bg-primary/10 p-3 shadow-lg">
            <div className="flex items-center justify-between gap-2"><div><div className="text-base font-black text-foreground">Game invite waiting</div><div className="text-xs text-muted-foreground">Accept to enter the same room.</div></div><Badge variant="secondary">Invite</Badge></div>
            {incomingInvites.map((invite) => (
              <div key={invite.id} className="grid gap-2 rounded-xl border bg-background/90 p-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                <div><div className="font-semibold">{invite.from_name} invited you</div><div className="text-xs text-muted-foreground">{invite.game_type === "same_challenge" ? "Same Challenge" : "Live Race"}</div></div>
                <div className="flex gap-2"><Button size="sm" onClick={() => acceptInvite(invite)} disabled={isBusy}>Accept</Button><Button size="sm" variant="outline" onClick={() => declineInvite(invite)} disabled={isBusy}>Decline</Button></div>
              </div>
            ))}
          </div>
        )}
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2"><div className="text-sm font-bold">Players</div><Button size="sm" variant="outline" onClick={() => void refreshInvites()} disabled={isBusy}>Refresh invites</Button></div>
          {players.length === 0 ? <div className="rounded-xl border bg-background/70 p-3 text-sm text-muted-foreground">No other active app sessions found.</div> : players.map((player) => {
            const incomingInvite = getIncomingInviteFrom(player);
            const pendingInvite = getPendingInviteTo(player);
            const canInvitePlayer = player.available_to_play && player.status === "available";
            return (
              <div key={player.device_id} className="grid gap-2 rounded-xl border bg-background/70 p-3 text-sm transition hover:border-primary/50 hover:bg-background sm:grid-cols-[1fr_auto] sm:items-center">
                <button type="button" className="min-w-0 text-left focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring" onClick={() => invitePlayer(player)} disabled={isBusy || Boolean(pendingInvite) || (!canInvitePlayer && !incomingInvite)}>
                  <div className="font-semibold">{player.display_name}</div><div className="text-xs text-muted-foreground">{playerStatusLabel(player)} · {shortDeviceId(player.device_id)}</div>
                </button>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Badge variant={incomingInvite ? "default" : pendingInvite ? "outline" : canInvitePlayer ? "secondary" : "outline"}>{incomingInvite ? "Accept" : pendingInvite ? "Waiting" : canInvitePlayer ? "Invite" : playerStatusLabel(player)}</Badge>
                  {pendingInvite && <Button size="sm" variant="outline" onClick={() => cancelInvite(pendingInvite)} disabled={isBusy}>{busyInviteId === pendingInvite.id ? "Cancelling..." : "Cancel"}</Button>}
                  {!pendingInvite && (incomingInvite || canInvitePlayer) && <Button size="sm" onClick={() => invitePlayer(player)} disabled={isBusy}>{incomingInvite ? "Accept" : "Invite"}</Button>}
                </div>
              </div>
            );
          })}
        </div>
        {sentInvites.length > 0 && (
          <div className="grid gap-2">
            <div className="text-sm font-bold">Recent invites</div>
            {sentInvites.map((invite) => (
              <div key={invite.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background/70 p-3 text-sm">
                <span>{invite.to_name}</span><div className="flex items-center gap-2"><Badge variant={invite.status === "accepted" ? "default" : "outline"}>{invite.status === "accepted" ? "Accepted. Opening room..." : "Waiting"}</Badge>{invite.status === "pending" && <Button size="sm" variant="outline" onClick={() => cancelInvite(invite)} disabled={isBusy}>{busyInviteId === invite.id ? "Cancelling..." : "Cancel"}</Button>}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
