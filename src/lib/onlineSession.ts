import type { OnlinePlayer, OnlineRoomSnapshot } from "@/types/online";

const ONLINE_ROOM_SESSION_KEY = "blink-and-find-online-room-session";
const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000;

export interface OnlineRoomSession {
  roomId: string;
  roomCode: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
  savedAt: number;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function shouldOfferSavedSession(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const params = new URLSearchParams(window.location.search);

  // Invite links already carry the room code and should not also restore another saved room.
  if (params.has("room")) {
    return false;
  }

  // Saved-room restore is now explicit so opening /online never traps people in the last room.
  return params.get("resume") === "1" || params.get("restore") === "1";
}

export function createOnlineRoomSession(snapshot: OnlineRoomSnapshot, localPlayer: OnlinePlayer): OnlineRoomSession {
  return {
    roomId: snapshot.room.id,
    roomCode: snapshot.room.code,
    playerId: localPlayer.id,
    playerName: localPlayer.name,
    isHost: localPlayer.is_host,
    savedAt: Date.now(),
  };
}

export function saveOnlineRoomSession(snapshot: OnlineRoomSnapshot, localPlayer: OnlinePlayer): OnlineRoomSession | null {
  if (!canUseStorage()) {
    return null;
  }

  const session = createOnlineRoomSession(snapshot, localPlayer);
  window.localStorage.setItem(ONLINE_ROOM_SESSION_KEY, JSON.stringify(session));
  return session;
}

function readOnlineRoomSession(): OnlineRoomSession | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem(ONLINE_ROOM_SESSION_KEY);

    if (!rawSession) {
      return null;
    }

    const session = JSON.parse(rawSession) as Partial<OnlineRoomSession>;

    if (!session.roomId || !session.roomCode || !session.playerId || !session.savedAt) {
      clearOnlineRoomSession();
      return null;
    }

    if (Date.now() - session.savedAt > MAX_SESSION_AGE_MS) {
      clearOnlineRoomSession();
      return null;
    }

    return {
      roomId: session.roomId,
      roomCode: session.roomCode,
      playerId: session.playerId,
      playerName: session.playerName || "Player",
      isHost: Boolean(session.isHost),
      savedAt: session.savedAt,
    };
  } catch {
    clearOnlineRoomSession();
    return null;
  }
}

export function loadOnlineRoomSession(): OnlineRoomSession | null {
  if (!shouldOfferSavedSession()) {
    return null;
  }

  return readOnlineRoomSession();
}

export function clearOnlineRoomSession(): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(ONLINE_ROOM_SESSION_KEY);
}

export function getOnlineRoomSessionAge(session: OnlineRoomSession): string {
  const ageMinutes = Math.max(1, Math.round((Date.now() - session.savedAt) / 60000));

  if (ageMinutes < 60) {
    return `${ageMinutes}m ago`;
  }

  return `${Math.round(ageMinutes / 60)}h ago`;
}
