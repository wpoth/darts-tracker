import { StyleSheet, Text, View } from "react-native";

import type { Player } from "@/src/types/darts";

type PlayerScoreCardProps = {
    player: Player;
    isActive: boolean;
};

export function PlayerScoreCard({ player, isActive }: PlayerScoreCardProps) {
    return (
        <View style={[styles.card, isActive && styles.activeCard]}>
            <View style={styles.topRow}>
                <Text style={[styles.name, isActive && styles.activeName]}>
                    {player.name}
                </Text>

                {isActive && <Text style={styles.turnBadge}>Turn</Text>}
            </View>

            <Text style={[styles.score, isActive && styles.activeScore]}>
                {player.remaining}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: "#111827",
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    activeCard: {
        borderColor: "#f97316",
        backgroundColor: "#1f2937",
    },
    topRow: {
        minHeight: 24,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    name: {
        color: "#9ca3af",
        fontSize: 13,
        fontWeight: "800",
    },
    activeName: {
        color: "#fed7aa",
    },
    score: {
        color: "#ffffff",
        fontSize: 42,
        fontWeight: "900",
        marginTop: 4,
        lineHeight: 48,
    },
    activeScore: {
        color: "#f97316",
    },
    turnBadge: {
        color: "#111827",
        backgroundColor: "#f97316",
        fontSize: 10,
        fontWeight: "900",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        overflow: "hidden",
    },
});