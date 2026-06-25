import { logAppEventNow } from "@/lib/appLogger";
import { getPlayerProfile } from "@/lib/playerProfile";

export type AnalyticsEventName =
  | "page_view"
  | "mode_opened"
  | "game_completed"
  | "online_room_created"
  | "online_room_joined"
  | "online_rematch_created"
  | "share_action"
  | "leaderboard_submit"
  | "error_reported";

export interface AnalyticsEvent {
  id: string;
  name: AnalyticsEventName;
  path: string;
  playerId: string;
  createdAt: string;
  properties?: Record<string, string | number | boolean | null>;
}

const ANALYTICS_KEY = "blink-and-find-analytics-events";
const MAX_EVENTS = 120;

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `event-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function loadAnalyticsEvents(): AnalyticsEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(ANALYTICS_KEY);
    return rawValue ? JSON.parse(rawValue) as AnalyticsEvent[] : [];
  } catch {
    return [];
  }
}

export function clearAnalyticsEvents() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ANALYTICS_KEY);
  }
}

export function trackEvent(name: AnalyticsEventName, properties?: AnalyticsEvent["properties"]) {
  if (typeof window === "undefined") {
    return null;
  }

  const profile = getPlayerProfile();
  const event: AnalyticsEvent = {
    id: createId(),
    name,
    path: window.location.pathname,
    playerId: profile.id,
    createdAt: new Date().toISOString(),
    properties,
  };

  const events = [...loadAnalyticsEvents(), event].slice(-MAX_EVENTS);
  window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent("blink-and-find:analytics", { detail: event }));
  logAppEventNow({
    level: name === "error_reported" ? "error" : "info",
    category: "analytics",
    eventName: name,
    metadata: properties,
  });

  return event;
}
