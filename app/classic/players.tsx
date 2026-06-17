import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    getCurrentUserProfile,
    type UserProfile,
} from "@/src/lib/profileDatabase";
import { supabase } from "@/src/lib/supabase";

type PlayerMode = {
    title: string;
    description: string;
    type: "solo" | "local-two" | "local-friend" | "remote";
    requiresLogin: boolean;
};

const playerModes: PlayerMode[] = [
    {
        title: "Solo",
        description: "Track one player only. Good for practice sessions.",
        type: "solo",
        requiresLogin: false,
    },
    {
        title: "Local two player",
        description: "Two generic players on the same phone.",
        type: "local-two",
        requiresLogin: false,
    },
    {
        title: "Local with friend",
        description: "Choose one of your friends and play together on one phone.",
        type: "local-friend",
        requiresLogin: true,
    },
    {
        title: "Remote invite friend",
        description: "Invite a friend and play together on two phones.",
        type: "remote",
        requiresLogin: true,
    },
];

export default function ClassicPlayersScreen() {
    const params = useLocalSearchParams<{
        title?: string;
        startingScore?: string;
        doubleIn?: string;
        doubleOut?: string;
        ruleTitle?: string;
    }>();

    const title = params.title ?? "501";
    const startingScore = params.startingScore ?? "501";
    const doubleIn = params.doubleIn ?? "false";
    const doubleOut = params.doubleOut ?? "false";
    const ruleTitle = params.ruleTitle ?? "Straight out";

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useFocusEffect(
        useCallback(() => {
            checkAccount();
        }, [])
    );

    async function checkAccount() {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        setIsLoggedIn(Boolean(user));

        if (!user) {
            setProfile(null);
            return;
        }

        const { profile: currentProfile } = await getCurrentUserProfile();
        setProfile(currentProfile);
    }

    function choosePlayerMode(mode: PlayerMode) {
        if (mode.requiresLogin && !isLoggedIn) {
            Alert.alert(
                "Login required",
                "You need to log in before using friend matches.",
                [
                    {
                        text: "Cancel",
                        style: "cancel",
                    },
                    {
                        text: "Login",
                        onPress: () => router.push("/login"),
                    },
                ]
            );

            return;
        }

        if (mode.requiresLogin && !profile) {
            Alert.alert(
                "Username required",
                "Create a username before using friend matches."
            );
            router.push("/profile-setup");
            return;
        }

        if (mode.type === "solo") {
            router.push({
                pathname: "/x01",
                params: {
                    title,
                    startingScore,
                    doubleIn,
                    doubleOut,
                    playerMode: "solo",
                    playerOneName: profile?.username ?? "Player 1",
                },
            });

            return;
        }

        if (mode.type === "local-two") {
            router.push({
                pathname: "/x01",
                params: {
                    title,
                    startingScore,
                    doubleIn,
                    doubleOut,
                    playerMode: "local-two",
                    playerOneName: profile?.username ?? "Player 1",
                    playerTwoName: "Player 2",
                },
            });

            return;
        }

        if (mode.type === "local-friend") {
            router.push({
                pathname: "/select-friend-match",
                params: {
                    title,
                    startingScore,
                    doubleIn,
                    doubleOut,
                    playerMode: "local-friend",
                },
            });

            return;
        }

        if (mode.type === "remote") {
            router.push({
                pathname: "/invite-match",
                params: {
                    title,
                    startingScore,
                    doubleIn,
                    doubleOut,
                    playerMode: "remote",
                },
            });
        }
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
                    <Text style={styles.title}>Who is playing?</Text>
                    <Text style={styles.subtitle}>
                        {ruleTitle} · {startingScore} starting score
                    </Text>
                </View>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Selected setup</Text>
                    <Text style={styles.summaryTitle}>{title}</Text>
                    <Text style={styles.summaryMeta}>
                        {startingScore} · {ruleTitle}
                        {doubleIn === "true" ? " · Double in" : ""}
                    </Text>
                </View>

                <View style={styles.list}>
                    {playerModes.map((mode) => {
                        const isDisabled = mode.requiresLogin && !isLoggedIn;

                        return (
                            <Pressable
                                key={mode.type}
                                style={[styles.optionCard, isDisabled && styles.disabledCard]}
                                onPress={() => choosePlayerMode(mode)}
                            >
                                <View style={styles.optionMain}>
                                    <Text
                                        style={[
                                            styles.optionTitle,
                                            isDisabled && styles.disabledTitle,
                                        ]}
                                    >
                                        {mode.title}
                                    </Text>

                                    <Text style={styles.optionDescription}>
                                        {mode.description}
                                    </Text>
                                </View>

                                <View
                                    style={[
                                        styles.statusBadge,
                                        isDisabled && styles.disabledBadge,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusBadgeText,
                                            isDisabled && styles.disabledBadgeText,
                                        ]}
                                    >
                                        {isDisabled ? "Login" : "Start"}
                                    </Text>
                                </View>
                            </Pressable>
                        );
                    })}
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
        marginBottom: 18,
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
        fontSize: 34,
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
    summaryCard: {
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 18,
        padding: 14,
        marginBottom: 18,
    },
    summaryLabel: {
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 4,
    },
    summaryTitle: {
        color: "#ffffff",
        fontSize: 24,
        fontWeight: "900",
    },
    summaryMeta: {
        color: "#fed7aa",
        fontSize: 14,
        fontWeight: "800",
        marginTop: 4,
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
        fontSize: 18,
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