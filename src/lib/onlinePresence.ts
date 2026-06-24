import { createOnlineRoom, joinOnlineRoom } from "@/lib/onlineRooms";
import { modeToDatabasePresence, type UserPresenceMode } from "@/lib/presencePreference";
import { supabase } from "@/lib/supabase";
import type { GameConfig } from "@/types/game";
import type { OnlineGameType, OnlinePlayer, OnlineRoomSnapshot } from "@/types/online";

const PRESENCE_STALE_SECONDS = 60;
const INVITE_EXPIRES_SECONDS = 90;

export type PresenceStatus = "online" | "available" | "in_game" | "offline";
export type InviteStatus = "pending" | "accepted" | "declined" | "cancelled" | "expired";

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

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function isMissingPresenceTableError(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("online_presence") ||
    message.includes("online_game_invites");
}

function staleCutoffIso() {
  return new Date(Date.now() - PRESENCE_STALE_SECONDS * 1000).toISOString();
}

function inviteExpiryIso() {
  return new Date(Date.now() + INVITE_EXPIRES_SECONDS * 1000).toISOString();
}

export async function upsertOnlinePresence(params: {
  deviceId: string;
  displayName: string;
  availableToPlay?: boolean;
  currentRoomId?: string | null;
  preferredMode?: UserPresenceMode;
}): Promise<PresenceResult<OnlinePresence | null>> {
  const client = requireSupabase();
  const displayName = params.displayName.trim() || "Player";
  const mapped = params.preferredMode
    ? modeToDatabasePresence(params.preferredMode)
    : { status: (params.currentRoomId ? "in_game" : params.availableToPlay ? "available" : "online") as PresenceStatus, availableToPlay: Boolean(params.availableToPlay) };
  const status = params.currentRoomId ? "in_game" : mapped.status;
  const availableToPlay = status === "available" && !params.currentRoomId;

  const { data, error } = await client
    .from("online_presence")
    .upsert({
      device_id: params.deviceId,
      display_name: displayName,
      status,
      available_to_play: availableToPlay,
      current_room_id: params.currentRoomId ?? null,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "device_id" })
    .select("*")
    .single();

  if (isMissingPresenceTableError(error)) {
    return { data: null, unavailable: true };
  }

  if (error) {
    throw error;
  }

  return { data: data as OnlinePresence, unavailable: false };
}

export async function setOnlinePresenceOffline(deviceId: string): Promise<void> {
  if (!supabase) {
    return;
  }

  await supabase
    .from("online_presence")
    .update({
      status: "offline",
      available_to_play: false,
      current_room_id: null,
      last_seen_at: new Date().toISOString(),
    })
    .eq("device_id", deviceId);
}

export async function fetchAvailableOnlinePlayers(deviceId: string): Promise<PresenceResult<OnlinePresence[]>> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("online_presence")
    .select("*")
    .neq("device_id", deviceId)
    .neq("status", "offline")
    .gte("last_seen_at", staleCutoffIso())
    .order("available_to_play", { ascending: false })
    .order("last_seen_at", { ascending: false })
    .limit(20);

  if (isMissingPresenceTableError(error)) {
    return { data: [], unavailable: true };
  }

  if (error) {
    throw error;
  }

  return { data: (data ?? []) as OnlinePresence[], unavailable: false };
}

export async function fetchIncomingInvites(deviceId: string): Promise<PresenceResult<OnlineGameInvite[]>> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("online_game_invites")
    .select("*")
    .eq("to_device_id", deviceId)
    .eq("status", "pending")
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  if (isMissingPresenceTableError(error)) {
    return { data: [], unavailable: true };
  }

  if (error) {
    throw error;
  }

  return { data: (data ?? []) as OnlineGameInvite[], unavailable: false };
}

export async function fetchSentInvites(deviceId: string): Promise<PresenceResult<OnlineGameInvite[]>> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("online_game_invites")
    .select("*")
    .eq("from_device_id", deviceId)
    .in("status", ["pending", "accepted"])
    .gte("expires_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  if (isMissingPresenceTableError(error)) {
    return { data: [], unavailable: true };
  }

  if (error) {
    throw error;
  }

  return { data: (data ?? []) as OnlineGameInvite[], unavailable: false };
}

async function findPendingInviteBetween(fromDeviceId: string, toDeviceId: string): Promise<OnlineGameInvite | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("online_game_invites")
    .select("*")
    .eq("status", "pending")
    .gte("expires_at", new Date().toISOString())
    .or(`and(from_device_id.eq.${fromDeviceId},to_device_id.eq.${toDeviceId}),and(from_device_id.eq.${toDeviceId},to_device_id.eq.${fromDeviceId})`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (isMissingPresenceTableError(error)) {
    return null;
  }

  if (error) {
    throw error;
  }

  return data as OnlineGameInvite | null;
}

export async function createOnlineInvite(params: {
  fromDeviceId: string;
  fromName: string;
  toPlayer: OnlinePresence;
  gameType: OnlineGameType;
  settings: GameConfig;
}): Promise<PresenceResult<OnlineGameInvite | null>> {
  const client = requireSupabase();

  if (!params.toPlayer.available_to_play || params.toPlayer.status !== "available") {
    throw new Error(`${params.toPlayer.display_name} is not available for invites right now.`);
  }

  const existingInvite = await findPendingInviteBetween(params.fromDeviceId, params.toPlayer.device_id);

  if (existingInvite) {
    return { data: existingInvite, unavailable: false };
  }

  const { data, error } = await client
    .from("online_game_invites")
    .insert({
      from_device_id: params.fromDeviceId,
      from_name: params.fromName.trim() || "Player",
      to_device_id: params.toPlayer.device_id,
      to_name: params.toPlayer.display_name,
      room_id: null,
      room_code: null,
      game_type: params.gameType,
      settings: params.settings,
      status: "pending",
      expires_at: inviteExpiryIso(),
    })
    .select("*")
    .single();

  if (isMissingPresenceTableError(error)) {
    return { data: null, unavailable: true };
  }

  if (error) {
    throw error;
  }

  return { data: data as OnlineGameInvite, unavailable: false };
}

async function ensureInviteRoom(invite: OnlineGameInvite): Promise<OnlineGameInvite> {
  if (invite.room_code && invite.room_id) {
    return invite;
  }

  const client = requireSupabase();
  const roomResult = await createOnlineRoom({
    playerName: invite.from_name,
    deviceId: invite.from_device_id,
    gameType: invite.game_type,
    settings: invite.settings,
  });

  const { data, error } = await client
    .from("online_game_invites")
    .update({ room_id: roomResult.room.id, room_code: roomResult.room.code })
    .eq("id", invite.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as OnlineGameInvite;
}

export async function acceptOnlineInvite(params: {
  invite: OnlineGameInvite;
  playerName: string;
  deviceId: string;
}): Promise<OnlineRoomSnapshot & { localPlayer: OnlinePlayer }> {
  const client = requireSupabase();
  const inviteWithRoom = await ensureInviteRoom(params.invite);

  const { error } = await client
    .from("online_game_invites")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", inviteWithRoom.id)
    .eq("status", "pending");

  if (error) {
    throw error;
  }

  if (!inviteWithRoom.room_code) {
    throw new Error("Invite accepted but room code is missing.");
  }

  return joinOnlineRoom({
    code: inviteWithRoom.room_code,
    playerName: params.playerName || inviteWithRoom.to_name,
    deviceId: params.deviceId,
  });
}

export async function joinAcceptedOnlineInvite(params: {
  invite: OnlineGameInvite;
  playerName: string;
  deviceId: string;
}): Promise<OnlineRoomSnapshot & { localPlayer: OnlinePlayer }> {
  if (!params.invite.room_code) {
    throw new Error("Invite was accepted, but the room is not ready yet.");
  }

  return joinOnlineRoom({
    code: params.invite.room_code,
    playerName: params.playerName || params.invite.from_name,
    deviceId: params.deviceId,
  });
}

export async function declineOnlineInvite(inviteId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from("online_game_invites")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", inviteId);

  if (error && !isMissingPresenceTableError(error)) {
    throw error;
  }
}

export async function subscribeToOnlinePresence(deviceId: string, onChange: () => void) {
  const client = requireSupabase();
  const channel = client
    .channel(`online-presence-${deviceId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "online_presence" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "online_game_invites", filter: `to_device_id=eq.${deviceId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "online_game_invites", filter: `from_device_id=eq.${deviceId}` }, onChange)
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
