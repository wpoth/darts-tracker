import { StyleSheet, Text, View } from "react-native";

import type { Turn } from "@/src/types/darts";

type TurnHistoryProps = {
  turns: Turn[];
};

export function TurnHistory({ turns }: TurnHistoryProps) {
  return (
    <View style={styles.history}>
      <Text style={styles.title}>Turns</Text>

      {turns.length === 0 ? (
        <Text style={styles.emptyText}>No turns yet.</Text>
      ) : (
        turns.slice(0, 10).map((turn, index) => (
          <View key={index} style={styles.turnRow}>
            <View>
              <Text style={styles.turnText}>
                {turn.playerName}: {turn.bust ? "Bust" : turn.score}
              </Text>

              <Text style={styles.turnSubText}>
                {turn.remainingBefore} → {turn.remainingAfter}
              </Text>
            </View>

            {turn.bust && <Text style={styles.bustBadge}>Bust</Text>}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  history: {
    marginTop: 28,
  },
  title: {
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
    alignItems: "center",
  },
  turnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  turnSubText: {
    color: "#9ca3af",
    fontSize: 15,
    marginTop: 4,
  },
  bustBadge: {
    color: "#fecaca",
    backgroundColor: "#7f1d1d",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: "hidden",
  },
});