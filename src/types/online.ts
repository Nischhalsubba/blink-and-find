import type { GameConfig } from "@/types/game";

export type OnlineGameType = "same_challenge" | "live_race";
export type OnlineRoomStatus = "lobby" | "ready" | "playing" | "round_summary" | "finished" | "abandoned";
export type OnlineRoundStatus = "waiting" | "preview" | "playing" | "complete";
export type OnlineRoomVisibility = "private" | "public";

export interface OnlineRoom {
  id: string;
  code: string;
  game_type: OnlineGameType;
  status: OnlineRoomStatus;
  visibility?: OnlineRoomVisibility;
  max_players?: number | null;
  host_player_id: string | null;
  settings: GameConfig;
  current_round: number;
  current_player_id: string | null;
  round_start_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnlinePlayer {
  id: string;
  room_id: string;
  name: string;
  device_id: string;
  is_host: boolean;
  is_connected: boolean;
  total_time_ms: number;
  wrong_taps: number;
  joined_at: string;
  updated_at: string;
}

export interface OnlineRound {
  id: string;
  room_id: string;
  round_number: number;
  seed: number;
  target_number: number;
  board_size: number;
  status: OnlineRoundStatus;
  start_at: string | null;
  created_at: string;
}

export interface OnlineResult {
  id: string;
  room_id: string;
  round_number: number;
  player_id: string;
  player_name: string;
  target_number: number;
  raw_time_ms: number;
  penalty_ms: number;
  final_time_ms: number;
  wrong_taps: number;
  placement: number | null;
  client_tap_at: string | null;
  server_received_at: string;
  created_at: string;
}

export interface OnlineRoomSnapshot {
  room: OnlineRoom;
  players: OnlinePlayer[];
  rounds: OnlineRound[];
  results: OnlineResult[];
}
