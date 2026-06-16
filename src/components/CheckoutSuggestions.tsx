import { StyleSheet, Text, View } from "react-native";

import { getCheckoutSuggestions } from "@/src/lib/checkoutSuggestions";

type CheckoutSuggestionsProps = {
    remaining: number;
    enabled: boolean;
};

export function CheckoutSuggestions({
    remaining,
    enabled,
}: CheckoutSuggestionsProps) {
    const suggestions = enabled ? getCheckoutSuggestions(remaining) : [];

    if (!enabled || suggestions.length === 0) {
        return null;
    }

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Checkout options</Text>
                <Text style={styles.remaining}>{remaining}</Text>
            </View>

            <View style={styles.routes}>
                {suggestions.map((suggestion) => (
                    <View key={suggestion.darts.join("-")} style={styles.route}>
                        {suggestion.darts.map((dart) => (
                            <Text key={dart} style={styles.dart}>
                                {dart}
                            </Text>
                        ))}
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 9,
    },
    title: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "900",
    },
    remaining: {
        color: "#fed7aa",
        fontSize: 13,
        fontWeight: "900",
    },
    routes: {
        gap: 7,
    },
    route: {
        flexDirection: "row",
        gap: 7,
        alignItems: "center",
    },
    dart: {
        color: "#111827",
        backgroundColor: "#f97316",
        fontSize: 13,
        fontWeight: "900",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        overflow: "hidden",
    },
});