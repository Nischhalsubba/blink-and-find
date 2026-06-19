import { Badge } from "@/components/ui/badge";
import type { OnlinePlayer, OnlineRoomSnapshot } from "@/types/online";

interface OnlinePlayerPresenceProps {
  player: OnlinePlayer;
  localPlayerId: string;
  snapshot: OnlineRoomSnapshot;
}

function getPresenceLabel(player: OnlinePlayer, snapshot: OnlineRoomSnapshot) {
  if (!player.is_connected) {
    return "Reconnecting";
  }

  if (snapshot.room.status === "lobby") {
    return "Ready";
  }

  if (snapshot.room.status === "finished") {
    return "Finished";
  }

  const hasCurrentRoundResult = snapshot.results.some((result) => {
    return result.player_id === player.id && result.round_number === snapshot.room.current_round;
  });

  if (hasCurrentRoundResult) {
    return "Done";
  }

  if (snapshot.room.current_player_id === player.id || snapshot.room.game_type === "live_race") {
    return "Playing";
  }

  return "Waiting";
}

export default function OnlinePlayerPresence({ player, localPlayerId, snapshot }: OnlinePlayerPresenceProps) {
  const label = getPresenceLabel(player, snapshot);

  return (
    <div className="flex items-center gap-2">
      <Badge variant={player.is_connected ? "outline" : "secondary"}>{label}</Badge>
      {player.is_host && <Badge variant="secondary">Host</Badge>}
      {player.id === localPlayerId && <Badge variant="outline">You</Badge>}
    </div>
  );
}
