import type { RealtimeChannel } from "@supabase/supabase-js";
import { createOnlineRoom, joinOnlineRoom } from "@/lib/onlineRooms";
import { modeToDatabasePresence, type UserPresenceMode } from "@/lib/presencePreference";
import { supabase } from "@/lib/supabase";
import type { GameConfig } from "@/types/game";
import type { OnlineGameType, OnlinePlayer, OnlineRoomSnapshot } from "@/types/online";

const PRESENCE_STALE_SECONDS = 90;
const INVITE_EXPIRES_SECONDS = 90;
const GLOBAL_PRESENCE_CHANNEL = "blink-find-online-presence-v2";

export type PresenceStatus = "online" | "available" | "in_game" | "offline";
export type InviteStatus = "pending" | "accepted" | "declined" | "cancelled" | "expired";
export type PresenceConnectionState = "connecting" | "live" | "reconnecting" | "offline";

export interface OnlinePresence {
  id: string;
  device_id: string;
  display_name: string;
  status: PresenceStatus;
  available_to_play: boolean;
  current_room_id: string | null;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface OnlineGameInvite {
  id: string;
  from_device_id: string;
  from_name: string;
  to_device_id: string;
  to_name: string;
  room_id: string | null;
  room_code: string | null;
  game_type: OnlineGameType;
  settings: GameConfig;
  status: InviteStatus;
  created_at: string;
  expires_at: string;
  responded_at: string | null;
}

export interface PresenceResult<T> {
  data: T;
  unavailable: boolean;
}

export interface LivePresencePayload {
  device_id: string;
  display_name: string;
  status: PresenceStatus;
  available_to_play: boolean;
  current_room_id: string | null;
  online_at: string;
}

export interface LivePresenceSubscription {
  update: (payload: LivePresencePayload) => Promise<unknown | null>;
  cleanup: () => Promise<void>;
}

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function isMissingPresenceTableError(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "42P01" || error?.code === "PGRST205" || message.includes("could not find") || message.includes("does not exist");
}

function staleCutoffIso() {
  return new Date(Date.now() - PRESENCE_STALE_SECONDS * 1000).toISOString();
}

function inviteExpiryIso() {
  return new Date(Date.now() + INVITE_EXPIRES_SECONDS * 1000).toISOString();
}

function toOnlinePresence(payload: LivePresencePayload): OnlinePresence {
  return {
    id: payload.device_id,
    device_id: payload.device_id,
    display_name: payload.display_name,
    status: payload.status,
    available_to_play: payload.available_to_play,
    current_room_id: payload.current_room_id,
    last_seen_at: payload.online_at,
    created_at: payload.online_at,
    updated_at: payload.online_at,
  };
}

function readLivePlayers(channel: RealtimeChannel, ownDeviceId: string): OnlinePresence[] {
  const uniquePlayers = new Map<string, OnlinePresence>();
  const state = channel.presenceState() as Record<string, Array<LivePresencePayload & { presence_ref?: string }>>;

  for (const presences of Object.values(state)) {
    const payload = presences.at(-1);
    if (!payload || payload.device_id === ownDeviceId || payload.status === "offline") continue;
    uniquePlayers.set(payload.device_id, toOnlinePresence(payload));
  }

  return [...uniquePlayers.values()].sort((a, b) => {
    if (a.available_to_play !== b.available_to_play) return a.available_to_play ? -1 : 1;
    return a.display_name.localeCompare(b.display_name);
  });
}

export function createLivePresencePayload(params: {
  deviceId: string;
  displayName: string;
  availableToPlay?: boolean;
  currentRoomId?: string | null;
  preferredMode?: UserPresenceMode;
}): LivePresencePayload {
  const mapped = params.preferredMode
    ? modeToDatabasePresence(params.preferredMode)
    : { status: (params.currentRoomId ? "in_game" : params.availableToPlay ? "available" : "online") as PresenceStatus, availableToPlay: Boolean(params.availableToPlay) };
  const status = params.currentRoomId ? "in_game" : mapped.status;

  return {
    device_id: params.deviceId,
    display_name: params.displayName.trim() || "Player",
    status,
    available_to_play: status === "available" && !params.currentRoomId,
    current_room_id: params.currentRoomId ?? null,
    online_at: new Date().toISOString(),
  };
}

export function subscribeToLivePresence(params: {
  initialPayload: LivePresencePayload;
  onPlayers?: (players: OnlinePresence[]) => void;
  onConnectionState?: (state: PresenceConnectionState) => void;
}): LivePresenceSubscription {
  const client = requireSupabase();
  let currentPayload = params.initialPayload;
  let subscribed = false;
  let closed = false;

  const channel = client.channel(GLOBAL_PRESENCE_CHANNEL, {
    config: { presence: { key: currentPayload.device_id } },
  });

  const syncPlayers = () => {
    if (!closed) params.onPlayers?.(readLivePlayers(channel, currentPayload.device_id));
  };

  channel
    .on("presence", { event: "sync" }, syncPlayers)
    .on("presence", { event: "join" }, syncPlayers)
    .on("presence", { event: "leave" }, syncPlayers)
    .subscribe(async (status) => {
      if (closed) return;

      if (status === "SUBSCRIBED") {
        subscribed = true;
        params.onConnectionState?.("live");
        await channel.track(currentPayload);
        syncPlayers();
        return;
      }

      subscribed = false;
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") params.onConnectionState?.("reconnecting");
      if (status === "CLOSED") params.onConnectionState?.("offline");
    });

  params.onConnectionState?.("connecting");

  return {
    async update(payload) {
      currentPayload = { ...payload, online_at: new Date().toISOString() };
      if (!subscribed || closed) return null;
      return channel.track(currentPayload);
    },
    async cleanup() {
      if (closed) return;
      closed = true;
      if (subscribed) await channel.untrack();
      await client.removeChannel(channel);
      params.onConnectionState?.("offline");
    },
  };
}

export function subscribeToInviteChanges(deviceId: string, onChange: () => void): () => Promise<void> {
  const client = requireSupabase();
  const channel = client
    .channel(`online-invites-${deviceId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "online_game_invites", filter: `to_device_id=eq.${deviceId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "online_game_invites", filter: `from_device_id=eq.${deviceId}` }, onChange)
    .subscribe();

  return async () => {
    await client.removeChannel(channel);
  };
}

export async function upsertOnlinePresence(params: { deviceId: string; displayName: string; availableToPlay?: boolean; currentRoomId?: string | null; preferredMode?: UserPresenceMode; }): Promise<PresenceResult<OnlinePresence | null>> {
  const client = requireSupabase();
  const payload = createLivePresencePayload(params);
  const { data, error } = await client.from("online_presence").upsert({
    device_id: payload.device_id,
    display_name: payload.display_name,
    status: payload.status,
    available_to_play: payload.available_to_play,
    current_room_id: payload.current_room_id,
    last_seen_at: payload.online_at,
  }, { onConflict: "device_id" }).select("*").single();
  if (isMissingPresenceTableError(error)) return { data: null, unavailable: true };
  if (error) throw error;
  return { data: data as OnlinePresence, unavailable: false };
}

export async function setOnlinePresenceOffline(deviceId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("online_presence").update({ status: "offline", available_to_play: false, current_room_id: null, last_seen_at: new Date().toISOString() }).eq("device_id", deviceId);
}

export async function fetchAvailableOnlinePlayers(deviceId: string): Promise<PresenceResult<OnlinePresence[]>> {
  const client = requireSupabase();
  const { data, error } = await client.from("online_presence").select("*").neq("device_id", deviceId).neq("status", "offline").gte("last_seen_at", staleCutoffIso()).order("available_to_play", { ascending: false }).order("last_seen_at", { ascending: false }).limit(50);
  if (isMissingPresenceTableError(error)) return { data: [], unavailable: true };
  if (error) throw error;
  return { data: (data ?? []) as OnlinePresence[], unavailable: false };
}

export async function fetchIncomingInvites(deviceId: string): Promise<PresenceResult<OnlineGameInvite[]>> {
  const client = requireSupabase();
  const { data, error } = await client.from("online_game_invites").select("*").eq("to_device_id", deviceId).eq("status", "pending").gte("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(10);
  if (isMissingPresenceTableError(error)) return { data: [], unavailable: true };
  if (error) throw error;
  return { data: (data ?? []) as OnlineGameInvite[], unavailable: false };
}

export async function fetchSentInvites(deviceId: string): Promise<PresenceResult<OnlineGameInvite[]>> {
  const client = requireSupabase();
  const { data, error } = await client.from("online_game_invites").select("*").eq("from_device_id", deviceId).in("status", ["pending", "accepted"]).gte("expires_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()).order("created_at", { ascending: false }).limit(10);
  if (isMissingPresenceTableError(error)) return { data: [], unavailable: true };
  if (error) throw error;
  return { data: (data ?? []) as OnlineGameInvite[], unavailable: false };
}

async function findPendingInviteBetween(fromDeviceId: string, toDeviceId: string): Promise<OnlineGameInvite | null> {
  const client = requireSupabase();
  const { data, error } = await client.from("online_game_invites").select("*").eq("status", "pending").gte("expires_at", new Date().toISOString()).or(`and(from_device_id.eq.${fromDeviceId},to_device_id.eq.${toDeviceId}),and(from_device_id.eq.${toDeviceId},to_device_id.eq.${fromDeviceId})`).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (isMissingPresenceTableError(error)) return null;
  if (error) throw error;
  return data as OnlineGameInvite | null;
}

export async function createOnlineInvite(params: { fromDeviceId: string; fromName: string; toPlayer: OnlinePresence; gameType: OnlineGameType; settings: GameConfig; }): Promise<PresenceResult<OnlineGameInvite | null>> {
  const client = requireSupabase();
  if (!params.toPlayer.available_to_play || params.toPlayer.status !== "available") throw new Error(`${params.toPlayer.display_name} is not available for invites right now.`);
  const existingInvite = await findPendingInviteBetween(params.fromDeviceId, params.toPlayer.device_id);
  if (existingInvite) return { data: existingInvite, unavailable: false };
  const roomResult = await createOnlineRoom({ playerName: params.fromName, deviceId: params.fromDeviceId, gameType: params.gameType, settings: params.settings });
  const { data, error } = await client.from("online_game_invites").insert({
    from_device_id: params.fromDeviceId,
    from_name: params.fromName.trim() || "Player",
    to_device_id: params.toPlayer.device_id,
    to_name: params.toPlayer.display_name,
    room_id: roomResult.room.id,
    room_code: roomResult.room.code,
    game_type: params.gameType,
    settings: params.settings,
    status: "pending",
    expires_at: inviteExpiryIso(),
  }).select("*").single();
  if (isMissingPresenceTableError(error)) return { data: null, unavailable: true };
  if (error) throw error;
  return { data: data as OnlineGameInvite, unavailable: false };
}

async function ensureInviteRoom(invite: OnlineGameInvite): Promise<OnlineGameInvite> {
  if (invite.room_code && invite.room_id) return invite;
  const client = requireSupabase();
  const roomResult = await createOnlineRoom({ playerName: invite.from_name, deviceId: invite.from_device_id, gameType: invite.game_type, settings: invite.settings });
  const { data, error } = await client.from("online_game_invites").update({ room_id: roomResult.room.id, room_code: roomResult.room.code }).eq("id", invite.id).select("*").single();
  if (error) throw error;
  return data as OnlineGameInvite;
}

export async function acceptOnlineInvite(params: { invite: OnlineGameInvite; playerName: string; deviceId: string; }): Promise<OnlineRoomSnapshot & { localPlayer: OnlinePlayer }> {
  const client = requireSupabase();
  const inviteWithRoom = await ensureInviteRoom(params.invite);
  const { error } = await client.from("online_game_invites").update({ status: "accepted", responded_at: new Date().toISOString() }).eq("id", inviteWithRoom.id).eq("status", "pending");
  if (error) throw error;
  if (!inviteWithRoom.room_code) throw new Error("Invite accepted but room code is missing.");
  return joinOnlineRoom({ code: inviteWithRoom.room_code, playerName: params.playerName || inviteWithRoom.to_name, deviceId: params.deviceId });
}

export async function joinAcceptedOnlineInvite(params: { invite: OnlineGameInvite; playerName: string; deviceId: string; }): Promise<OnlineRoomSnapshot & { localPlayer: OnlinePlayer }> {
  if (!params.invite.room_code) throw new Error("Invite was accepted, but the room is not ready yet.");
  return joinOnlineRoom({ code: params.invite.room_code, playerName: params.playerName || params.invite.from_name, deviceId: params.deviceId });
}

export async function declineOnlineInvite(inviteId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("online_game_invites").update({ status: "declined", responded_at: new Date().toISOString() }).eq("id", inviteId);
  if (error && !isMissingPresenceTableError(error)) throw error;
}

export async function cancelOnlineInvite(invite: OnlineGameInvite): Promise<void> {
  const client = requireSupabase();
  const respondedAt = new Date().toISOString();
  const { error } = await client.from("online_game_invites").update({ status: "cancelled", responded_at: respondedAt }).eq("id", invite.id).eq("status", "pending");
  if (error && !isMissingPresenceTableError(error)) throw error;
  if (invite.room_id) {
    const { error: roomError } = await client.from("online_rooms").update({ status: "abandoned", current_player_id: null, round_start_at: null }).eq("id", invite.room_id).eq("status", "lobby");
    if (roomError && !isMissingPresenceTableError(roomError)) throw roomError;
  }
}

/** @deprecated Use subscribeToLivePresence and subscribeToInviteChanges. */
export async function subscribeToOnlinePresence(deviceId: string, onChange: () => void) {
  return subscribeToInviteChanges(deviceId, onChange);
}
