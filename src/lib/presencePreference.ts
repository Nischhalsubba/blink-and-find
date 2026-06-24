export type UserPresenceMode = "online" | "away" | "busy" | "offline";
export type DatabasePresenceStatus = "available" | "online" | "in_game" | "offline";

export const PRESENCE_MODE_KEY = "blink-and-find-presence-mode";
export const PRESENCE_FORCE_BUSY_KEY = "blink-and-find-presence-force-busy";
export const PRESENCE_MODE_EVENT = "blink-and-find-presence-mode-change";

const VALID_MODES: UserPresenceMode[] = ["online", "away", "busy", "offline"];

export function getPresenceMode(): UserPresenceMode {
  if (typeof window === "undefined") {
    return "online";
  }

  const value = window.localStorage.getItem(PRESENCE_MODE_KEY) as UserPresenceMode | null;
  return value && VALID_MODES.includes(value) ? value : "online";
}

export function setPresenceMode(mode: UserPresenceMode) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PRESENCE_MODE_KEY, mode);
  window.dispatchEvent(new Event(PRESENCE_MODE_EVENT));
}

export function setPresenceForceBusy(forceBusy: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  if (forceBusy) {
    window.localStorage.setItem(PRESENCE_FORCE_BUSY_KEY, "true");
  } else {
    window.localStorage.removeItem(PRESENCE_FORCE_BUSY_KEY);
  }

  window.dispatchEvent(new Event(PRESENCE_MODE_EVENT));
}

export function isPresenceForceBusy() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(PRESENCE_FORCE_BUSY_KEY) === "true";
}

export function getEffectivePresenceMode(): UserPresenceMode {
  return isPresenceForceBusy() ? "busy" : getPresenceMode();
}

export function modeToDatabasePresence(mode: UserPresenceMode): { status: DatabasePresenceStatus; availableToPlay: boolean } {
  if (mode === "online") {
    return { status: "available", availableToPlay: true };
  }

  if (mode === "busy") {
    return { status: "in_game", availableToPlay: false };
  }

  if (mode === "offline") {
    return { status: "offline", availableToPlay: false };
  }

  return { status: "online", availableToPlay: false };
}

export function databasePresenceToUserLabel(status: string, availableToPlay: boolean) {
  if (status === "offline") {
    return "Offline";
  }

  if (status === "in_game") {
    return "Busy";
  }

  if (availableToPlay || status === "available") {
    return "Online";
  }

  return "Away";
}

export function canReceiveInvites(mode: UserPresenceMode) {
  return mode === "online";
}
