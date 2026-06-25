"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeviceId } from "@/lib/device";
import { acceptOnlineInvite, declineOnlineInvite, fetchIncomingInvites, fetchSentInvites, joinAcceptedOnlineInvite, setOnlinePresenceOffline, upsertOnlinePresence, type OnlineGameInvite } from "@/lib/onlinePresence";
import { canReceiveInvites, databasePresenceToUserLabel, getEffectivePresenceMode, PRESENCE_MODE_EVENT, setPresenceMode, type UserPresenceMode } from "@/lib/presencePreference";
import { saveOnlineRoomSession } from "@/lib/onlineSession";
import { getPlayerProfile } from "@/lib/playerProfile";
import { hasSupabaseConfig } from "@/lib/supabase";

const POLL_MS = 1000;
const STATUS_OPTIONS: Array<{ mode: UserPresenceMode; label: string; helper: string }> = [
  { mode: "online", label: "Online", helper: "Inviteable" },
  { mode: "away", label: "Away", helper: "No invites" },
  { mode: "busy", label: "Busy", helper: "Playing" },
  { mode: "offline", label: "Offline", helper: "Hidden" },
];

function shortDeviceId(deviceId: string) {
  return deviceId.slice(0, 8).toUpperCase();
}

function roomUrl(roomCode: string) {
  return `/online?room=${roomCode}&join=1`;
}

export default function AppOnlinePresence() {
  const pathname = usePathname();
  const deviceId = useMemo(() => getDeviceId(), []);
  const handledAcceptedInviteIds = useRef(new Set<string>());
  const [mode, setModeState] = useState<UserPresenceMode>(() => getEffectivePresenceMode());
  const [profileName, setProfileName] = useState("Player");
  const [incomingInvites, setIncomingInvites] = useState<OnlineGameInvite[]>([]);
  const [statusMessage, setStatusMessage] = useState("Connecting");
  const [isBusy, setIsBusy] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const isOnlineRoute = pathname?.startsWith("/online") ?? false;
  const showStatusControl = pathname === "/";
  const canShowInvitePopup = !isOnlineRoute && canReceiveInvites(mode);
  const primaryInvite = canShowInvitePopup ? incomingInvites[0] : null;

  function syncMode() {
    setModeState(getEffectivePresenceMode());
  }

  async function openRoom(result: Awaited<ReturnType<typeof acceptOnlineInvite>>) {
    saveOnlineRoomSession(result, result.localPlayer);
    window.location.href = roomUrl(result.room.code);
  }

  async function joinAcceptedInvite(invite: OnlineGameInvite) {
    if (handledAcceptedInviteIds.current.has(invite.id) || !invite.room_code) return;
    handledAcceptedInviteIds.current.add(invite.id);
    setStatusMessage("Opening room");

    try {
      const result = await joinAcceptedOnlineInvite({ invite, playerName: profileName, deviceId });
      await openRoom(result);
    } catch (error) {
      handledAcceptedInviteIds.current.delete(invite.id);
      setStatusMessage(error instanceof Error ? error.message : "Could not open room");
    }
  }

  async function refreshInvites(currentMode = mode) {
    if (!hasSupabaseConfig() || !canReceiveInvites(currentMode)) {
      setIncomingInvites([]);
      return;
    }

    try {
      const [incomingResult, sentResult] = await Promise.all([fetchIncomingInvites(deviceId), fetchSentInvites(deviceId)]);
      setIncomingInvites(incomingResult.data);
      const acceptedInvite = sentResult.data.find((invite) => invite.status === "accepted" && invite.room_code);
      if (acceptedInvite) await joinAcceptedInvite(acceptedInvite);
    } catch {
      // Ignore invite polling failures.
    }
  }

  async function heartbeat() {
    if (!hasSupabaseConfig()) return;
    const nextMode = getEffectivePresenceMode();
    const profile = getPlayerProfile();
    setModeState(nextMode);
    setProfileName(profile.name);

    if (isOnlineRoute) return;

    try {
      const result = await upsertOnlinePresence({ deviceId, displayName: profile.name, preferredMode: nextMode, currentRoomId: null });
      if (result.unavailable) setStatusMessage("Migration missing");
      else if (result.data) setStatusMessage(databasePresenceToUserLabel(result.data.status, result.data.available_to_play));
      await refreshInvites(nextMode);
    } catch {
      setStatusMessage("Offline");
    }
  }

  async function acceptInvite(invite: OnlineGameInvite) {
    setIsBusy(true);
    try {
      const result = await acceptOnlineInvite({ invite, playerName: profileName, deviceId });
      await openRoom(result);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not accept invite");
    } finally {
      setIsBusy(false);
    }
  }

  async function declineInvite(invite: OnlineGameInvite) {
    setIsBusy(true);
    try {
      await declineOnlineInvite(invite.id);
      setIncomingInvites((current) => current.filter((item) => item.id !== invite.id));
      setStatusMessage("Invite declined");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not decline invite");
    } finally {
      setIsBusy(false);
    }
  }

  function chooseMode(nextMode: UserPresenceMode) {
    setPresenceMode(nextMode);
    setModeState(nextMode);
    void heartbeat();
  }

  useEffect(() => {
    syncMode();
    void heartbeat();
    const timer = window.setInterval(() => void heartbeat(), POLL_MS);
    window.addEventListener(PRESENCE_MODE_EVENT, syncMode);
    window.addEventListener("focus", heartbeat);
    document.addEventListener("visibilitychange", heartbeat);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener(PRESENCE_MODE_EVENT, syncMode);
      window.removeEventListener("focus", heartbeat);
      document.removeEventListener("visibilitychange", heartbeat);
      void setOnlinePresenceOffline(deviceId);
    };
  }, [deviceId, isOnlineRoute, mode, profileName]);

  return (
    <>
      {showStatusControl && (
        <div className="fixed right-2 top-2 z-[70] flex max-w-[calc(50vw-0.35rem)] justify-end sm:right-4 sm:top-4 sm:max-w-[19rem]">
          <div className="relative flex justify-end">
            <button type="button" onClick={() => setStatusOpen((open) => !open)} className="flex max-w-full items-center gap-1.5 rounded-full border bg-white/90 px-2.5 py-2 text-xs font-black shadow-lg backdrop-blur transition hover:-translate-y-0.5 sm:gap-2 sm:px-3">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${mode === "online" ? "bg-green-500" : mode === "away" ? "bg-amber-400" : mode === "busy" ? "bg-fuchsia-500" : "bg-slate-400"}`} />
              <span className="max-w-[4.5rem] truncate sm:max-w-[7rem]">{mode === "offline" ? "Hidden" : statusMessage}</span>
              <span className="hidden text-slate-500 sm:inline">{shortDeviceId(deviceId)}</span>
            </button>

            {statusOpen && (
              <Card className="absolute right-0 top-full mt-2 w-[19rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border bg-white/95 shadow-xl backdrop-blur">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-black">Online status</CardTitle>
                      <CardDescription className="truncate text-xs">{profileName}</CardDescription>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 shrink-0 rounded-full px-2" onClick={() => setStatusOpen(false)}>Close</Button>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 p-3 pt-1">
                  {STATUS_OPTIONS.map((option) => (
                    <button key={option.mode} type="button" onClick={() => chooseMode(option.mode)} className={`rounded-xl border p-2 text-left text-xs transition ${mode === option.mode ? "border-primary bg-primary text-primary-foreground" : "border-slate-200 bg-white/70 text-slate-700 hover:bg-slate-50"}`}>
                      <span className="block font-black">{option.label}</span>
                      <span className="mt-0.5 block text-[0.68rem] opacity-80">{option.helper}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {primaryInvite && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Game invite">
          <Card className="w-full max-w-lg overflow-hidden rounded-[2rem] border bg-white shadow-2xl">
            <CardHeader className="border-b p-6 text-center">
              <Badge variant="secondary" className="mx-auto mb-3 w-fit rounded-full">Game Invite</Badge>
              <CardTitle className="text-3xl font-black tracking-[-0.04em]">{primaryInvite.from_name} wants to play</CardTitle>
              <CardDescription className="mx-auto max-w-sm text-base leading-7">Accept and a shared room will be created for both players.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 p-5 text-center text-sm text-muted-foreground">
              <div>{primaryInvite.game_type === "same_challenge" ? "Same Challenge" : "Live Race"}</div>
              <div>{primaryInvite.settings.boardSize} slots · {primaryInvite.settings.totalRounds} rounds · +{primaryInvite.settings.penaltySeconds}s penalty</div>
            </CardContent>
            <CardFooter className="grid gap-2 border-t p-5 sm:grid-cols-2">
              <Button className="h-12 rounded-2xl font-black" onClick={() => acceptInvite(primaryInvite)} disabled={isBusy}>{isBusy ? "Opening..." : "Accept"}</Button>
              <Button className="h-12 rounded-2xl font-bold" variant="outline" onClick={() => declineInvite(primaryInvite)} disabled={isBusy}>Decline</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
