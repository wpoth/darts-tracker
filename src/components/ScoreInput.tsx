import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type ScoreInputProps = {
    value: string;
    onChangeValue: (value: string) => void;
    onSubmit: () => void;
};

export function ScoreInput({
    value,
    onChangeValue,
    onSubmit,
}: ScoreInputProps) {
    return (
        <View style={styles.section}>
            <TextInput
                value={value}
                onChangeText={onChangeValue}
                keyboardType="number-pad"
                placeholder="Enter score"
                placeholderTextColor="#6b7280"
                style={styles.input}
            />

            <Pressable style={styles.primaryButton} onPress={onSubmit}>
                <Text style={styles.primaryButtonText}>Submit score</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
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
});