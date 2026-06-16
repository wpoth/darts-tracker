import { StyleSheet, Text, View } from "react-native";

import type { Turn } from "@/src/types/darts";

type TurnHistoryProps = {
    turns: Turn[];
};

export function TurnHistory({ turns }: TurnHistoryProps) {
    return (
        <View style={styles.history}>
            <Text style={styles.title}>Last turns</Text>

            {turns.length === 0 ? (
                <Text style={styles.emptyText}>No turns yet.</Text>
            ) : (
                turns.slice(0, 3).map((turn, index) => (
                    <View key={index} style={styles.turnRow}>
                        <View>
                            <Text style={styles.turnText}>
                                {turn.playerName}:{" "}
                                {turn.checkout
                                    ? `Checkout ${turn.score}`
                                    : turn.bust
                                        ? "Bust"
                                        : turn.score}
                            </Text>

                            <Text style={styles.turnSubText}>
                                {turn.remainingBefore} → {turn.remainingAfter}
                            </Text>
                        </View>

                        {turn.checkout && <Text style={styles.checkoutBadge}>Win</Text>}
                        {turn.bust && <Text style={styles.bustBadge}>Bust</Text>}
                    </View>
                ))
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    history: {
        marginTop: 14,
    },
    title: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "900",
        marginBottom: 8,
    },
    emptyText: {
        color: "#64748b",
        fontSize: 14,
    },
    turnRow: {
        backgroundColor: "#0f172a",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 9,
        marginBottom: 6,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    turnText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "800",
    },
    turnSubText: {
        color: "#9ca3af",
        fontSize: 13,
        fontWeight: "700",
    },
    bustBadge: {
        color: "#fecaca",
        backgroundColor: "#7f1d1d",
        fontSize: 11,
        fontWeight: "900",
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 999,
        overflow: "hidden",
    },
    checkoutBadge: {
        color: "#dcfce7",
        backgroundColor: "#166534",
        fontSize: 11,
        fontWeight: "900",
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 999,
        overflow: "hidden",
    },
});