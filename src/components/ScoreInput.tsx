import { Pressable, StyleSheet, Text, View } from "react-native";

type ScoreInputProps = {
    value: string;
    onChangeValue: (value: string) => void;
    onSubmit: () => void;
};

const keypadRows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["C", "0", "⌫"],
];

export function ScoreInput({ value, onChangeValue, onSubmit }: ScoreInputProps) {
    function handleKeyPress(key: string) {
        if (key === "C") {
            onChangeValue("");
            return;
        }

        if (key === "⌫") {
            onChangeValue(value.slice(0, -1));
            return;
        }

        const nextValue = `${value}${key}`;

        if (nextValue.length > 3) {
            return;
        }

        const numberValue = Number(nextValue);

        if (numberValue > 180) {
            return;
        }

        onChangeValue(nextValue);
    }

    const canSubmit = value.length > 0;

    return (
        <View style={styles.container}>
            <View style={styles.displayRow}>
                <View style={styles.scoreDisplay}>
                    <Text style={styles.scoreLabel}>Score</Text>
                    <Text style={styles.scoreValue}>{value || "0"}</Text>
                </View>

                <Pressable
                    style={[styles.submitButton, !canSubmit && styles.disabledSubmit]}
                    onPress={onSubmit}
                    disabled={!canSubmit}
                >
                    <Text style={styles.submitButtonText}>Submit</Text>
                </Pressable>
            </View>

            <View style={styles.keypad}>
                {keypadRows.map((row) => (
                    <View key={row.join("-")} style={styles.keypadRow}>
                        {row.map((key) => (
                            <Pressable
                                key={key}
                                style={[
                                    styles.keyButton,
                                    key === "C" && styles.utilityButton,
                                    key === "⌫" && styles.utilityButton,
                                ]}
                                onPress={() => handleKeyPress(key)}
                            >
                                <Text
                                    style={[
                                        styles.keyButtonText,
                                        (key === "C" || key === "⌫") && styles.utilityButtonText,
                                    ]}
                                >
                                    {key}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 18,
        padding: 10,
        gap: 10,
    },
    displayRow: {
        flexDirection: "row",
        alignItems: "stretch",
        gap: 8,
    },
    scoreDisplay: {
        flex: 1,
        backgroundColor: "#020617",
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        justifyContent: "center",
        minHeight: 58,
    },
    scoreLabel: {
        color: "#64748b",
        fontSize: 11,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    scoreValue: {
        color: "#ffffff",
        fontSize: 24,
        fontWeight: "900",
        marginTop: 1,
    },
    submitButton: {
        width: 104,
        backgroundColor: "#f97316",
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 58,
    },
    disabledSubmit: {
        opacity: 0.45,
    },
    submitButtonText: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "900",
    },
    keypad: {
        gap: 8,
    },
    keypadRow: {
        flexDirection: "row",
        gap: 8,
    },
    keyButton: {
        flex: 1,
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 14,
        minHeight: 48,
        alignItems: "center",
        justifyContent: "center",
    },
    keyButtonText: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "900",
    },
    utilityButton: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
    },
    utilityButtonText: {
        color: "#fed7aa",
    },
});