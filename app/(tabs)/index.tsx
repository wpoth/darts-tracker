import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { applyTurn } from "@/src/lib/dartsScoring";

type Turn = {
  score: number;
  remainingBefore: number;
  remainingAfter: number;
  bust: boolean;
};

export default function HomeScreen() {
  const [remaining, setRemaining] = useState(501);
  const [scoreInput, setScoreInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);

  function submitScore() {
    const score = Number(scoreInput);

    const result = applyTurn(remaining, score);

    if (result.error) {
      Alert.alert("Invalid score", result.error);
      return;
    }

    const turn: Turn = {
      score,
      remainingBefore: remaining,
      remainingAfter: result.remainingAfter,
      bust: result.bust,
    };

    setTurns((currentTurns) => [turn, ...currentTurns]);
    setRemaining(result.remainingAfter);
    setScoreInput("");

    if (result.remainingAfter === 0) {
      Alert.alert("Leg finished", "Nice checkout.");
    }
  }

  function undoLastTurn() {
    const [lastTurn, ...previousTurns] = turns;

    if (!lastTurn) {
      return;
    }

    setRemaining(lastTurn.remainingBefore);
    setTurns(previousTurns);
  }

  function resetMatch() {
    setRemaining(501);
    setScoreInput("");
    setTurns([]);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>501 x01</Text>
        <Text style={styles.title}>Darts Tracker</Text>
      </View>

      <View style={styles.scoreCard}>
        <Text style={styles.label}>Remaining</Text>
        <Text style={styles.remaining}>{remaining}</Text>
      </View>

      <View style={styles.inputSection}>
        <TextInput
          value={scoreInput}
          onChangeText={setScoreInput}
          keyboardType="number-pad"
          placeholder="Enter score"
          placeholderTextColor="#6b7280"
          style={styles.input}
        />

        <Pressable style={styles.primaryButton} onPress={submitScore}>
          <Text style={styles.primaryButtonText}>Submit score</Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.secondaryButton} onPress={undoLastTurn}>
          <Text style={styles.secondaryButtonText}>Undo</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={resetMatch}>
          <Text style={styles.secondaryButtonText}>Reset</Text>
        </Pressable>
      </View>

      <View style={styles.history}>
        <Text style={styles.historyTitle}>Turns</Text>

        {turns.length === 0 ? (
          <Text style={styles.emptyText}>No turns yet.</Text>
        ) : (
          turns.slice(0, 8).map((turn, index) => (
            <View key={index} style={styles.turnRow}>
              <Text style={styles.turnText}>
                {turn.bust ? "Bust" : turn.score}
              </Text>

              <Text style={styles.turnSubText}>
                {turn.remainingBefore} → {turn.remainingAfter}
              </Text>
            </View>
          ))
        )}
      </View>
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
  scoreCard: {
    backgroundColor: "#111827",
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 24,
  },
  label: {
    color: "#9ca3af",
    fontSize: 16,
    marginBottom: 8,
  },
  remaining: {
    color: "#ffffff",
    fontSize: 88,
    fontWeight: "900",
  },
  inputSection: {
    gap: 12,
  },
  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    color: "#ffffff",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 22,
  },
  primaryButton: {
    backgroundColor: "#f97316",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#111827",
    fontSize: 18,
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
  history: {
    marginTop: 28,
  },
  historyTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 16,
  },
  turnRow: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  turnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  turnSubText: {
    color: "#9ca3af",
    fontSize: 16,
  },
});