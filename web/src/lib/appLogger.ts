import { getDeviceId } from "@/lib/device";
import { getPlayerProfile } from "@/lib/playerProfile";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export type AppLogLevel = "debug" | "info" | "warn" | "error";

export interface AppLogInput {
  level?: AppLogLevel;
  category?: string;
  eventName: string;
  message?: string;
  roomId?: string | null;
  roomCode?: string | null;
  metadata?: Record<string, unknown>;
}

export interface StoredAppLog {
  id: string;
  level: AppLogLevel;
  category: string;
  eventName: string;
  message?: string;
  path: string;
  deviceId?: string;
  playerId?: string;
  playerName?: string;
  roomId?: string | null;
  roomCode?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const LOCAL_LOG_KEY = "blink-and-find-app-event-logs";
const MAX_LOCAL_LOGS = 250;
const MAX_STRING_LENGTH = 1200;
let remoteLoggingUnavailable = false;

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `log-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getPath() {
  if (typeof window === "undefined") {
    return "server";
  }

  return `${window.location.pathname}${window.location.search}`;
}

function getUserAgent() {
  if (typeof navigator === "undefined") {
    return null;
  }

  return navigator.userAgent.slice(0, 500);
}

function safeString(value: string) {
  return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}...` : value;
}

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return safeString(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: safeString(value.message),
      stack: value.stack ? safeString(value.stack) : undefined,
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map(sanitizeValue);
  }

  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>).slice(0, 60)) {
      output[key] = sanitizeValue(nestedValue);
    }
    return output;
  }

  return safeString(String(value));
}

function sanitizeMetadata(metadata?: Record<string, unknown>) {
  return (sanitizeValue(metadata ?? {}) ?? {}) as Record<string, unknown>;
}

export function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: typeof error,
    message: String(error),
  };
}

export function loadAppLogs(): StoredAppLog[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(LOCAL_LOG_KEY);
    return rawValue ? JSON.parse(rawValue) as StoredAppLog[] : [];
  } catch {
    return [];
  }
}

export function clearAppLogs() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(LOCAL_LOG_KEY);
  }
}

function saveLocalLog(log: StoredAppLog) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const logs = [...loadAppLogs(), log].slice(-MAX_LOCAL_LOGS);
    window.localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent("blink-and-find:app-log", { detail: log }));
  } catch {
    // Logging should never break the game. That would be impressively dumb.
  }
}

function createLog(input: AppLogInput): StoredAppLog {
  const profile = typeof window === "undefined" ? null : getPlayerProfile();
  const deviceId = typeof window === "undefined" ? undefined : getDeviceId();

  return {
    id: createId(),
    level: input.level ?? "info",
    category: input.category ?? "app",
    eventName: input.eventName,
    message: input.message ? safeString(input.message) : undefined,
    path: getPath(),
    deviceId,
    playerId: profile?.id,
    playerName: profile?.name,
    roomId: input.roomId ?? null,
    roomCode: input.roomCode ?? null,
    metadata: sanitizeMetadata(input.metadata),
    createdAt: new Date().toISOString(),
  };
}

export async function logAppEvent(input: AppLogInput) {
  const log = createLog(input);
  saveLocalLog(log);

  if (!hasSupabaseConfig() || !supabase || remoteLoggingUnavailable) {
    return log;
  }

  try {
    const { error } = await supabase.from("app_event_logs").insert({
      level: log.level,
      category: log.category,
      event_name: log.eventName,
      message: log.message ?? null,
      path: log.path,
      device_id: log.deviceId ?? null,
      player_id: log.playerId ?? null,
      player_name: log.playerName ?? null,
      room_id: log.roomId ?? null,
      room_code: log.roomCode ?? null,
      user_agent: getUserAgent(),
      metadata: log.metadata,
      created_at: log.createdAt,
    });

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205" || error.message?.toLowerCase().includes("app_event_logs")) {
        remoteLoggingUnavailable = true;
      }
      // Keep local logs as fallback. No throwing from telemetry. Humanity has suffered enough.
    }
  } catch {
    // Network/logging failures must not interrupt gameplay.
  }

  return log;
}

export function logAppEventNow(input: AppLogInput) {
  void logAppEvent(input);
}

export function reportAppError(error: unknown, context: string, metadata?: Record<string, unknown>) {
  const serialized = serializeError(error);
  return logAppEvent({
    level: "error",
    category: "error",
    eventName: context,
    message: serialized.message,
    metadata: {
      ...metadata,
      error: serialized,
    },
  });
}

export function reportAppErrorNow(error: unknown, context: string, metadata?: Record<string, unknown>) {
  void reportAppError(error, context, metadata);
}
