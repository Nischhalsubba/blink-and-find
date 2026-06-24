"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeviceId } from "@/lib/device";
import {
  acceptOnlineInvite,
  createOnlineInvite,
  declineOnlineInvite,
  fetchAvailableOnlinePlayers,
  fetchIncomingInvites,
  fetchSentInvites,
  joinAcceptedOnlineInvite,
  subscribeToOnlinePresence,
  upsertOnlinePresence,
  type OnlineGameInvite,
  type OnlinePresence,
} from "@/lib/onlinePresence";
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

function loadAvailability() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.localStorage.getItem(AVAILABILITY_KEY) !== "false";
}

function saveAvailability(value: boolean) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AVAILABILITY_KEY, value ? "true" : "false");
  }
}

function shortDeviceId(deviceId: string) {
  return deviceId.slice(0, 8).toUpperCase();
}

export default function OnlineAvailablePlayers({
  playerName,
  gameType,
  settings,
  currentRoomId = null,
  onEnterRoom,
  onMessage,
}: OnlineAvailablePlayersProps) {
  const deviceId = useMemo(() => getDeviceId(), []);
  const handledAcceptedInviteIds = useRef(new Set<string>());
  const [availableToPlay, setAvailableToPlay] = useState(loadAvailability);
  const [players, setPlayers] = useState<OnlinePresence[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<OnlineGameInvite[]>([]);
  const [sentInvites, setSentInvites] = useState<OnlineGameInvite[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const [lastHeartbeatAt, setLastHeartbeatAt] = useState<Date | null>(null);
  const [statusMessage, setStatusMessage] = useState("Connecting to online presence...");
  const [isBusy, setIsBusy] = useState(false);

  const isVisibleToOthers = availableToPlay && !currentRoomId && !unavailable;

  async function enterAcceptedInvite(invite: OnlineGameInvite) {
    if (handledAcceptedInviteIds.current.has(invite.id)) {
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
  }

  async function refreshPresenceData() {
    try {
      const [availableResult, incomingResult, sentResult] = await Promise.all([
        fetchAvailableOnlinePlayers(deviceId),
        fetchIncomingInvites(deviceId),
        fetchSentInvites(deviceId),
      ]);

      setPlayers(availableResult.data);
      setIncomingInvites(incomingResult.data);
      setSentInvites(sentResult.data);

      const nextUnavailable = availableResult.unavailable || incomingResult.unavailable || sentResult.unavailable;
      setUnavailable(nextUnavailable);

      if (nextUnavailable) {
        setStatusMessage("Presence tables are missing. Run supabase/presence_invites.sql.");
      } else {
        setStatusMessage(`Presence connected. Found ${availableResult.data.length} other available player${availableResult.data.length === 1 ? "" : "s"}.`);
      }

      const acceptedInvite = sentResult.data.find((invite) => invite.status === "accepted" && invite.room_code);
      if (acceptedInvite) {
        await enterAcceptedInvite(acceptedInvite);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not refresh online players.";
      setStatusMessage(message);
      onMessage(message);
    }
  }

  async function heartbeat() {
    try {
      const result = await upsertOnlinePresence({
        deviceId,
        displayName: playerName,
        availableToPlay,
        currentRoomId,
      });

      setUnavailable(result.unavailable);
      setLastHeartbeatAt(new Date());

      if (result.unavailable) {
        setStatusMessage("Presence tables are missing. Run supabase/presence_invites.sql.");
        return;
      }

      setStatusMessage(availableToPlay ? "You are visible to other players." : "You are hidden from the online player list.");
      await refreshPresenceData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update online availability.";
      setStatusMessage(message);
      onMessage(message);
    }
  }

  useEffect(() => {
    saveAvailability(availableToPlay);
    void heartbeat();

    const timer = window.setInterval(() => {
      void heartbeat();
    }, 5_000);

    let unsubscribe: (() => void) | undefined;
    subscribeToOnlinePresence(deviceId, () => {
      void heartbeat();
    }).then((cleanup) => {
      unsubscribe = cleanup;
    }).catch(() => {
      // Missing migration or realtime permissions should not break the online page.
    });

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void heartbeat();
      }
    }

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      unsubscribe?.();
    };
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

    if (incomingInvite) {
      await acceptInvite(incomingInvite);
      return;
    }

    if (pendingInvite) {
      onMessage(`Invite already sent to ${player.display_name}. Waiting for them to accept.`);
      return;
    }

    setIsBusy(true);
    onMessage(`Sending invite to ${player.display_name}...`);

    try {
      const result = await createOnlineInvite({
        fromDeviceId: deviceId,
        fromName: playerName,
        toPlayer: player,
        gameType,
        settings,
      });

      if (result.unavailable || !result.data) {
        onMessage("Player invites need the latest Supabase migration.");
        return;
      }

      if (result.data.from_device_id !== deviceId) {
        onMessage(`${player.display_name} already invited you. Accept their invite above.`);
      } else {
        onMessage(`Invite sent to ${player.display_name}. Waiting for them to accept.`);
      }

      await refreshPresenceData();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Could not invite that player.");
    } finally {
      setIsBusy(false);
    }
  }

  async function acceptInvite(invite: OnlineGameInvite) {
    setIsBusy(true);
    onMessage(`Accepting ${invite.from_name}'s invite...`);

    try {
      const result = await acceptOnlineInvite({ invite, playerName, deviceId });
      onEnterRoom(result, `Accepted ${invite.from_name}'s invite. You are both in room ${result.room.code}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Could not accept invite.");
    } finally {
      setIsBusy(false);
    }
  }

  async function declineInvite(invite: OnlineGameInvite) {
    setIsBusy(true);

    try {
      await declineOnlineInvite(invite.id);
      setIncomingInvites((current) => current.filter((item) => item.id !== invite.id));
      onMessage(`Declined ${invite.from_name}'s invite.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Could not decline invite.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Card className="overflow-hidden rounded-[1.5rem] border bg-muted/20">
      <CardHeader className="border-b pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-black">Players online now</CardTitle>
            <CardDescription>Turn availability on, tap a player, and send an invite.</CardDescription>
          </div>
          <Button
            size="sm"
            variant={availableToPlay ? "default" : "outline"}
            onClick={() => setAvailableToPlay((current) => !current)}
          >
            {availableToPlay ? "Available" : "Hidden"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 p-3">
        <div className="grid gap-2 rounded-xl border bg-background/70 p-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-foreground">Presence status</span>
            <Badge variant={isVisibleToOthers ? "default" : "outline"}>{isVisibleToOthers ? "Visible" : "Not visible"}</Badge>
          </div>
          <div>{statusMessage}</div>
          <div>
            This browser: <span className="font-mono text-foreground">{shortDeviceId(deviceId)}</span>
            {lastHeartbeatAt ? ` · Last heartbeat ${lastHeartbeatAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}
          </div>
        </div>

        {unavailable && (
          <div className="rounded-xl border bg-background/70 p-3 text-sm text-muted-foreground">
            Online player discovery needs the new Supabase presence migration. Run <span className="font-mono text-foreground">supabase/presence_invites.sql</span> in Supabase SQL Editor. Room codes still work until the database catches up, because naturally the database wants paperwork.
          </div>
        )}

        {incomingInvites.length > 0 && (
          <div className="grid gap-2 rounded-[1.25rem] border-2 border-primary bg-primary/10 p-3 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-base font-black text-foreground">Game invite waiting</div>
                <div className="text-xs text-muted-foreground">Accept to enter the same room, or decline and continue browsing.</div>
              </div>
              <Badge variant="secondary">Popup</Badge>
            </div>

            {incomingInvites.map((invite) => (
              <div key={invite.id} className="grid gap-2 rounded-xl border bg-background/90 p-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="font-semibold">{invite.from_name} invited you</div>
                  <div className="text-xs text-muted-foreground">Room {invite.room_code} · {invite.game_type === "same_challenge" ? "Same Challenge" : "Live Race"}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => acceptInvite(invite)} disabled={isBusy}>Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => declineInvite(invite)} disabled={isBusy}>Decline</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-bold">Available players</div>
            <Button size="sm" variant="outline" onClick={() => void heartbeat()} disabled={isBusy}>{isBusy ? "Working..." : "Refresh"}</Button>
          </div>

          {players.length === 0 ? (
            <div className="rounded-xl border bg-background/70 p-3 text-sm text-muted-foreground">
              No other available players found yet. Open this page in another browser, keep both set to Available, then press Refresh on both. Because apparently even games need a seance sometimes.
            </div>
          ) : (
            players.map((player) => {
              const incomingInvite = getIncomingInviteFrom(player);
              const pendingInvite = getPendingInviteTo(player);

              return (
                <button
                  key={player.device_id}
                  type="button"
                  className="flex items-center justify-between gap-3 rounded-xl border bg-background/70 p-3 text-left text-sm transition hover:border-primary/50 hover:bg-background focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  onClick={() => invitePlayer(player)}
                  disabled={isBusy || Boolean(pendingInvite)}
                >
                  <div>
                    <div className="font-semibold">{player.display_name}</div>
                    <div className="text-xs text-muted-foreground">Seen {new Date(player.last_seen_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {shortDeviceId(player.device_id)}</div>
                  </div>
                  <Badge variant={incomingInvite ? "default" : pendingInvite ? "outline" : "secondary"}>
                    {incomingInvite ? "Accept" : pendingInvite ? "Waiting" : "Invite"}
                  </Badge>
                </button>
              );
            })
          )}
        </div>

        {sentInvites.length > 0 && (
          <div className="grid gap-2">
            <div className="text-sm font-bold">Recent invites</div>
            {sentInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between gap-2 rounded-xl border bg-background/70 p-3 text-sm">
                <span>{invite.to_name}</span>
                <Badge variant={invite.status === "accepted" ? "default" : "outline"}>{invite.status === "accepted" ? "Accepted. Opening room..." : "Waiting"}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
