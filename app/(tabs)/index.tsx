import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PlayerScoreCard } from "@/src/components/PlayerScoreCard";
import { ScoreInput } from "@/src/components/ScoreInput";
import { TurnHistory } from "@/src/components/TurnHistory";
import { applyTurn } from "@/src/lib/dartsScoring";
import type { Player, Turn } from "@/src/types/darts";
import { speakTurnResult } from "@/src/lib/voiceover";
const STARTING_SCORE = 501;

export default function HomeScreen() {
  const [players, setPlayers] = useState<Player[]>([
    {
      id: "player-1",
      name: "Player 1",
      remaining: STARTING_SCORE,
    },
    {
      id: "player-2",
      name: "Player 2",
      remaining: STARTING_SCORE,
    },
  ]);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [scoreInput, setScoreInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [legFinished, setLegFinished] = useState(false);

  const currentPlayer = players[currentPlayerIndex];

  function getNextPlayerIndex() {
    return currentPlayerIndex === players.length - 1
      ? 0
      : currentPlayerIndex + 1;
  }

  function resetLeg(startingPlayerIndex = 0) {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player) => ({
        ...player,
        remaining: STARTING_SCORE,
      }))
    );

    setCurrentPlayerIndex(startingPlayerIndex);
    setScoreInput("");
    setTurns([]);
    setLegFinished(false);
  }

  function finishLeg(winnerName: string) {
    setLegFinished(true);
    setScoreInput("");

    Alert.alert("Leg finished", `${winnerName} wins the leg.`, [
      {
        text: "Start new leg",
        onPress: () => {
          resetLeg(0);
        },
      },
    ]);
  }

  function submitScore() {
    if (legFinished) {
      Alert.alert("Leg already finished", "Start a new leg to continue.");
      return;
    }

    const score = Number(scoreInput);

    const firstResult = applyTurn(currentPlayer.remaining, score, {
      requiresDoubleOut: true,
      finishedOnDouble: false,
    });

    if (firstResult.error) {
      Alert.alert("Invalid score", firstResult.error);
      return;
    }

    if (firstResult.needsDoubleConfirmation) {
      Alert.alert(
        "Double out?",
        `Did ${currentPlayer.name} finish on a double?`,
        [
          {
            text: "No, bust",
            style: "cancel",
            onPress: () => {
              const turn: Turn = {
                playerId: currentPlayer.id,
                playerName: currentPlayer.name,
                score,
                remainingBefore: currentPlayer.remaining,
                remainingAfter: currentPlayer.remaining,
                bust: true,
              };

              speakTurnResult(
                currentPlayer.name,
                score,
                currentPlayer.remaining,
                true
              );

              setTurns((currentTurns) => [turn, ...currentTurns]);
              setScoreInput("");
              setCurrentPlayerIndex(getNextPlayerIndex());
            },
          },
          {
            text: "Yes, checkout",
            onPress: () => {
              const finalResult = applyTurn(currentPlayer.remaining, score, {
                requiresDoubleOut: true,
                finishedOnDouble: true,
              });

              const turn: Turn = {
                playerId: currentPlayer.id,
                playerName: currentPlayer.name,
                score,
                remainingBefore: currentPlayer.remaining,
                remainingAfter: finalResult.remainingAfter,
                bust: false,
              };

              speakTurnResult(
                currentPlayer.name,
                score,
                currentPlayer.remaining,
                true
              );

              setPlayers((currentPlayers) =>
                currentPlayers.map((player) => {
                  if (player.id !== currentPlayer.id) {
                    return player;
                  }

                  return {
                    ...player,
                    remaining: finalResult.remainingAfter,
                  };
                })
              );

              setTurns((currentTurns) => [turn, ...currentTurns]);

              finishLeg(currentPlayer.name);
            },
          },
        ]
      );

      return;
    }

    const turn: Turn = {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      score,
      remainingBefore: currentPlayer.remaining,
      remainingAfter: firstResult.remainingAfter,
      bust: firstResult.bust,
    };

    speakTurnResult(
      currentPlayer.name,
      score,
      firstResult.remainingAfter,
      firstResult.bust
    );

    setPlayers((currentPlayers) =>
      currentPlayers.map((player) => {
        if (player.id !== currentPlayer.id) {
          return player;
        }

        return {
          ...player,
          remaining: firstResult.remainingAfter,
        };
      })
    );

    setTurns((currentTurns) => [turn, ...currentTurns]);
    setScoreInput("");

    if (firstResult.remainingAfter === 0) {
      finishLeg(currentPlayer.name);
      return;
    }

    setCurrentPlayerIndex(getNextPlayerIndex());
  }

  function undoLastTurn() {
    if (legFinished) {
      return;
    }

    const [lastTurn, ...previousTurns] = turns;

    if (!lastTurn) {
      return;
    }

    setPlayers((currentPlayers) =>
      currentPlayers.map((player) => {
        if (player.id !== lastTurn.playerId) {
          return player;
        }

        return {
          ...player,
          remaining: lastTurn.remainingBefore,
        };
      })
    );

    const previousPlayerIndex = players.findIndex(
      (player) => player.id === lastTurn.playerId
    );

    if (previousPlayerIndex !== -1) {
      setCurrentPlayerIndex(previousPlayerIndex);
    }

    setTurns(previousTurns);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>501 x01</Text>
          <Text style={styles.title}>Darts Tracker</Text>
        </View>

        <Text style={styles.currentTurn}>
          {legFinished ? "Leg finished" : currentPlayer.name}
        </Text>
      </View>

      <View style={styles.playersGrid}>
        {players.map((player, index) => (
          <PlayerScoreCard
            key={player.id}
            player={player}
            isActive={!legFinished && index === currentPlayerIndex}
          />
        ))}
      </View>

      <ScoreInput
        value={scoreInput}
        onChangeValue={setScoreInput}
        onSubmit={submitScore}
      />

      <View style={styles.actions}>
        <Pressable
          style={[styles.secondaryButton, legFinished && styles.disabledButton]}
          onPress={undoLastTurn}
          disabled={legFinished}
        >
          <Text style={styles.secondaryButtonText}>Undo</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => resetLeg(0)}>
          <Text style={styles.secondaryButtonText}>
            {legFinished ? "New leg" : "Reset"}
          </Text>
        </Pressable>
      </View>

      <TurnHistory turns={turns} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  header: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  eyebrow: {
    color: "#f97316",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 2,
  },
  currentTurn: {
    color: "#fed7aa",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 3,
  },
  playersGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  disabledButton: {
    opacity: 0.45,
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});