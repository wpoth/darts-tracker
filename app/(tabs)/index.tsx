import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PlayerScoreCard } from "@/src/components/PlayerScoreCard";
import { ScoreInput } from "@/src/components/ScoreInput";
import { TurnHistory } from "@/src/components/TurnHistory";
import { applyTurn } from "@/src/lib/dartsScoring";
import type { Player, Turn } from "@/src/types/darts";

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

  const currentPlayer = players[currentPlayerIndex];

  function getNextPlayerIndex() {
    return currentPlayerIndex === players.length - 1
      ? 0
      : currentPlayerIndex + 1;
  }

  function submitScore() {
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
              setScoreInput("");

              Alert.alert(
                "Leg finished",
                `${currentPlayer.name} wins the leg.`
              );
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
    setCurrentPlayerIndex(getNextPlayerIndex());
  }

  function undoLastTurn() {
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

  function resetMatch() {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player) => ({
        ...player,
        remaining: STARTING_SCORE,
      }))
    );

    setCurrentPlayerIndex(0);
    setScoreInput("");
    setTurns([]);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>501 x01</Text>
        <Text style={styles.title}>Darts Tracker</Text>
      </View>

      <View style={styles.playersGrid}>
        {players.map((player, index) => (
          <PlayerScoreCard
            key={player.id}
            player={player}
            isActive={index === currentPlayerIndex}
          />
        ))}
      </View>

      <View style={styles.currentTurnCard}>
        <Text style={styles.label}>Current player</Text>
        <Text style={styles.currentPlayerName}>{currentPlayer.name}</Text>
      </View>

      <ScoreInput
        value={scoreInput}
        onChangeValue={setScoreInput}
        onSubmit={submitScore}
      />

      <View style={styles.actions}>
        <Pressable style={styles.secondaryButton} onPress={undoLastTurn}>
          <Text style={styles.secondaryButtonText}>Undo</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={resetMatch}>
          <Text style={styles.secondaryButtonText}>Reset</Text>
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
    padding: 20,
  },
  header: {
    marginTop: 16,
    marginBottom: 24,
  },
  eyebrow: {
    color: "#f97316",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 6,
  },
  playersGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  currentTurnCard: {
    backgroundColor: "#0f172a",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 16,
  },
  label: {
    color: "#9ca3af",
    fontSize: 15,
    marginBottom: 6,
  },
  currentPlayerName: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});