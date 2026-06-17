import { router, useLocalSearchParams } from "expo-router";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ruleOptions = [
    {
        title: "Straight out",
        description: "Start normally and finish without needing a double.",
        doubleIn: false,
        doubleOut: false,
        enabled: true,
    },
    {
        title: "Double out",
        description: "Start normally, but you must finish on a double.",
        doubleIn: false,
        doubleOut: true,
        enabled: true,
    },
    {
        title: "Double in / Double out",
        description: "You must start and finish on a double.",
        doubleIn: true,
        doubleOut: true,
        enabled: false,
    },
    {
        title: "Double in / Straight out",
        description: "You must start on a double, but can finish normally.",
        doubleIn: true,
        doubleOut: false,
        enabled: false,
    },
];

export default function ClassicRulesScreen() {
    const params = useLocalSearchParams<{
        title?: string;
        startingScore?: string;
    }>();

    const title = params.title ?? "501";
    const startingScore = params.startingScore ?? "501";

    function chooseRules(option: (typeof ruleOptions)[number]) {
        if (!option.enabled) {
            return;
        }

        router.push({
            pathname: "/classic/players",
            params: {
                title,
                startingScore,
                doubleIn: String(option.doubleIn),
                doubleOut: String(option.doubleOut),
                ruleTitle: option.title,
            },
        });
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} hitSlop={12}>
                        <Text style={styles.backText}>← Back</Text>
                    </Pressable>

                    <Text style={styles.eyebrow}>Classic X01 · {title}</Text>
                    <Text style={styles.title}>Choose rules</Text>
                    <Text style={styles.subtitle}>
                        Select how the match starts and how players need to finish.
                    </Text>
                </View>

                <View style={styles.list}>
                    {ruleOptions.map((option) => (
                        <Pressable
                            key={option.title}
                            style={[
                                styles.optionCard,
                                !option.enabled && styles.disabledCard,
                            ]}
                            onPress={() => chooseRules(option)}
                        >
                            <View style={styles.optionMain}>
                                <Text
                                    style={[
                                        styles.optionTitle,
                                        !option.enabled && styles.disabledTitle,
                                    ]}
                                >
                                    {option.title}
                                </Text>

                                <Text style={styles.optionDescription}>
                                    {option.description}
                                </Text>
                            </View>

                            <View
                                style={[
                                    styles.statusBadge,
                                    !option.enabled && styles.disabledBadge,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.statusBadgeText,
                                        !option.enabled && styles.disabledBadgeText,
                                    ]}
                                >
                                    {option.enabled ? "Select" : "Soon"}
                                </Text>
                            </View>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#020617",
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 32,
    },
    header: {
        marginBottom: 24,
    },
    backText: {
        color: "#94a3b8",
        fontSize: 14,
        fontWeight: "800",
        marginBottom: 18,
    },
    eyebrow: {
        color: "#f97316",
        fontSize: 12,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    title: {
        color: "#ffffff",
        fontSize: 36,
        fontWeight: "900",
        letterSpacing: -1,
    },
    subtitle: {
        color: "#94a3b8",
        fontSize: 15,
        fontWeight: "600",
        lineHeight: 22,
        marginTop: 8,
    },
    list: {
        gap: 12,
    },
    optionCard: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 20,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    disabledCard: {
        opacity: 0.58,
    },
    optionMain: {
        flex: 1,
    },
    optionTitle: {
        color: "#ffffff",
        fontSize: 19,
        fontWeight: "900",
    },
    disabledTitle: {
        color: "#cbd5e1",
    },
    optionDescription: {
        color: "#94a3b8",
        fontSize: 14,
        fontWeight: "600",
        lineHeight: 20,
        marginTop: 5,
    },
    statusBadge: {
        backgroundColor: "#f97316",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    statusBadgeText: {
        color: "#111827",
        fontSize: 12,
        fontWeight: "900",
    },
    disabledBadge: {
        backgroundColor: "#1e293b",
        borderWidth: 1,
        borderColor: "#334155",
    },
    disabledBadgeText: {
        color: "#94a3b8",
    },
});