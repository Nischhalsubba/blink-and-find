"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { saveLocalLeaderboardScore, submitGlobalLeaderboardScore } from "@/lib/leaderboard";

interface LeaderboardSaveButtonProps {
  playerName: string;
  mode?: string;
  scoreMs: number;
  wrongTaps: number;
  accuracyPercent: number;
}

export default function LeaderboardSaveButton({
  playerName,
  mode = "classic",
  scoreMs,
  wrongTaps,
  accuracyPercent,
}: LeaderboardSaveButtonProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "local" | "error">("idle");

  async function saveScore() {
    setStatus("saving");

    try {
      saveLocalLeaderboardScore({ playerName, mode, scoreMs, wrongTaps, accuracyPercent });
      const globalResult = await submitGlobalLeaderboardScore({ playerName, mode, scoreMs, wrongTaps, accuracyPercent });
      setStatus(globalResult.saved ? "saved" : "local");
    } catch {
      setStatus("error");
    }
  }

  const label = {
    idle: "Save to Leaderboard",
    saving: "Saving...",
    saved: "Saved Globally",
    local: "Saved Locally",
    error: "Try Saving Again",
  }[status];

  return (
    <Button variant="outline" onClick={saveScore} disabled={status === "saving" || status === "saved" || status === "local"}>
      {label}
    </Button>
  );
}
