import { StyleSheet, Text, View } from "react-native";

import type { Player } from "@/src/types/darts";

type PlayerScoreCardProps = {
  player: Player;
  isActive: boolean;
};

export function PlayerScoreCard({ player, isActive }: PlayerScoreCardProps) {
  return (
    <View style={[styles.card, isActive && styles.activeCard]}>
      <Text style={[styles.name, isActive && styles.activeName]}>
        {player.name}
      </Text>

      <Text style={[styles.score, isActive && styles.activeScore]}>
        {player.remaining}
      </Text>

      {isActive && <Text style={styles.turnBadge}>Current turn</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  activeCard: {
    borderColor: "#f97316",
    backgroundColor: "#1f2937",
  },
  name: {
    color: "#9ca3af",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  activeName: {
    color: "#fed7aa",
  },
  score: {
    color: "#ffffff",
    fontSize: 48,
    fontWeight: "900",
  },
  activeScore: {
    color: "#f97316",
  },
  turnBadge: {
    alignSelf: "flex-start",
    color: "#111827",
    backgroundColor: "#f97316",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 12,
    overflow: "hidden",
  },
});