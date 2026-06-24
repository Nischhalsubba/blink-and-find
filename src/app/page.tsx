"use client";

import GameScreen from "@/components/GameScreen";
import ReadyScreen from "@/components/ReadyScreen";
import ResultScreen from "@/components/ResultScreen";
import RoundSummary from "@/components/RoundSummary";
import StartScreen from "@/components/StartScreen";
import { useGameController } from "@/hooks/useGameController";

/**
 * Route component for Blink & Find.
 * Game logic now lives in useGameController; this file only decides which screen to show.
 */
export default function HomePage() {
  const game = useGameController();

  if (game.phase === "setup") {
    return (
      <main className="app-shell">
        <StartScreen
          mode={game.mode}
          playerNames={game.mode === "single" ? ["Player 1"] : game.playerNames}
          totalRounds={game.totalRounds}
          difficulty={game.difficulty}
          penaltySeconds={game.penaltySeconds}
          customNumbersInput={game.customNumbersInput}
          onModeChange={game.setMode}
          onPlayerNamesChange={game.setPlayerNames}
          onTotalRoundsChange={game.setTotalRounds}
          onDifficultyChange={game.setDifficulty}
          onPenaltySecondsChange={game.setPenaltySeconds}
          onCustomNumbersInputChange={game.setCustomNumbersInput}
          onStart={game.handleStart}
        />
      </main>
    );
  }

  if (game.phase === "ready") {
    return (
      <main className="app-shell">
        <ReadyScreen
          player={game.currentPlayer}
          round={game.currentRound}
          totalPlayers={game.players.length}
          playerIndex={game.currentPlayerIndex}
          config={game.config}
          onStartTurn={game.startPreparedTurn}
          onBackToSetup={game.resetGame}
        />
      </main>
    );
  }

  if (game.phase === "roundSummary") {
    return (
      <main className="app-shell">
        <RoundSummary
          round={game.currentRound}
          totalRounds={game.config.totalRounds}
          players={game.players}
          results={game.results}
          onNextRound={game.startNextRound}
          onFinishGame={game.finishGame}
        />
      </main>
    );
  }

  if (game.phase === "finished") {
    return (
      <main className="app-shell">
        <ResultScreen
          players={game.players}
          results={game.results}
          bestScore={game.bestScore}
          latestScore={game.latestScore}
          isNewBest={game.isNewBest}
          onPlayAgain={game.resetGame}
        />
      </main>
    );
  }

  return (
    <GameScreen
      phase={game.phase}
      config={game.config}
      currentPlayer={game.currentPlayer}
      currentRound={game.currentRound}
      board={game.board}
      targetNumber={game.targetNumber}
      targetHidden={game.targetHidden}
      elapsedMs={game.elapsedMs}
      previewCountdown={game.previewCountdown}
      currentWrongTaps={game.currentWrongTaps}
      lastSelectedNumber={game.lastSelectedNumber}
      lastSelectionWasWrong={game.lastSelectionWasWrong}
      lastResult={game.lastResult}
      statusMessage={game.statusMessage}
      isMuted={game.isMuted}
      autoContinue={game.autoContinue}
      onNumberSelect={game.handleNumberSelect}
      onContinue={game.continueGame}
      onBackToSetup={game.resetGame}
      onToggleMute={game.toggleMute}
      onToggleAutoContinue={game.toggleAutoContinue}
    />
  );
}
