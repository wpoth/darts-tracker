import { router } from "expo-router";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const x01Options = [
    {
        title: "301",
        startingScore: 301,
        description: "Fast match. Good for quick games or warmups.",
    },
    {
        title: "501",
        startingScore: 501,
        description: "Standard classic darts format.",
    },
    {
        title: "701",
        startingScore: 701,
        description: "Longer match with more room for comebacks.",
    },
];

export default function ClassicScreen() {
    function chooseScore(option: (typeof x01Options)[number]) {
        router.push({
            pathname: "/classic/rules",
            params: {
                title: option.title,
                startingScore: String(option.startingScore),
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

                    <Text style={styles.eyebrow}>Classic X01</Text>
                    <Text style={styles.title}>Choose score</Text>
                    <Text style={styles.subtitle}>
                        Pick the starting score for your X01 match.
                    </Text>
                </View>

                <View style={styles.list}>
                    {x01Options.map((option) => (
                        <Pressable
                            key={option.title}
                            style={styles.optionCard}
                            onPress={() => chooseScore(option)}
                        >
                            <View style={styles.optionMain}>
                                <Text style={styles.optionTitle}>{option.title}</Text>
                                <Text style={styles.optionDescription}>
                                    {option.description}
                                </Text>
                            </View>

                            <Text style={styles.arrow}>→</Text>
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
    optionMain: {
        flex: 1,
    },
    optionTitle: {
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "900",
    },
    optionDescription: {
        color: "#94a3b8",
        fontSize: 14,
        fontWeight: "600",
        lineHeight: 20,
        marginTop: 4,
    },
    arrow: {
        color: "#f97316",
        fontSize: 24,
        fontWeight: "900",
    },
});