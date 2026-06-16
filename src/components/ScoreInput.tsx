import { Pressable, StyleSheet, Text, View } from "react-native";

type ScoreInputProps = {
    value: string;
    onChangeValue: (value: string) => void;
    onSubmit: () => void;
};

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"];

export function ScoreInput({
    value,
    onChangeValue,
    onSubmit,
}: ScoreInputProps) {
    function addDigit(digit: string) {
        const nextValue = `${value}${digit}`;

        if (nextValue.length > 3) {
            return;
        }

        if (Number(nextValue) > 180) {
            return;
        }

        onChangeValue(nextValue);
    }

    function handleKeyPress(key: string) {
        if (key === "C") {
            onChangeValue("");
            return;
        }

        if (key === "⌫") {
            onChangeValue(value.slice(0, -1));
            return;
        }

        addDigit(key);
    }

    return (
        <View style={styles.section}>
            <View style={styles.displayRow}>
                <View>
                    <Text style={styles.displayLabel}>Score</Text>
                    <Text style={[styles.displayValue, !value && styles.placeholder]}>
                        {value || "0"}
                    </Text>
                </View>

                <Pressable
                    style={[styles.submitButton, !value && styles.disabledButton]}
                    onPress={onSubmit}
                    disabled={!value}
                >
                    <Text style={styles.submitButtonText}>Submit</Text>
                </Pressable>
            </View>

            <View style={styles.numpad}>
                {keys.map((key) => {
                    const isUtilityKey = key === "C" || key === "⌫";

                    return (
                        <Pressable
                            key={key}
                            style={[
                                styles.numpadButton,
                                isUtilityKey && styles.utilityButton,
                            ]}
                            onPress={() => handleKeyPress(key)}
                        >
                            <Text
                                style={[
                                    styles.numpadText,
                                    isUtilityKey && styles.utilityButtonText,
                                ]}
                            >
                                {key}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        gap: 10,
    },
    displayRow: {
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 18,
        padding: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    displayLabel: {
        color: "#9ca3af",
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 2,
    },
    displayValue: {
        color: "#ffffff",
        fontSize: 36,
        fontWeight: "900",
        lineHeight: 42,
    },
    placeholder: {
        color: "#475569",
    },
    submitButton: {
        backgroundColor: "#f97316",
        borderRadius: 14,
        paddingHorizontal: 22,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    disabledButton: {
        opacity: 0.45,
    },
    submitButtonText: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "900",
    },
    numpad: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    numpadButton: {
        width: "31.8%",
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 16,
        paddingVertical: 13,
        alignItems: "center",
        justifyContent: "center",
    },
    utilityButton: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
    },
    numpadText: {
        color: "#ffffff",
        fontSize: 23,
        fontWeight: "900",
    },
    utilityButtonText: {
        color: "#fed7aa",
    },
});