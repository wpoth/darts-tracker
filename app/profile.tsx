import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    Pressable,
    RefreshControl,
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
import {
    ensureCurrentUserStats,
    type PlayerStats,
} from "@/src/lib/playerStatsDatabase";
import { getRecentMatchResults } from "@/src/lib/matchResultsDatabase";
import { supabase } from "@/src/lib/supabase";

type RecentMatchRow = {
    id: string;
    won: boolean;
    username: string;
    opponent_username: string | null;
    total_score: number;
    total_turns: number;
    highest_score: number;
    highest_checkout: number;
    created_at: string;
    match_results:
    | {
        id: string;
        game_title: string;
        starting_score: number;
        double_in: boolean;
        double_out: boolean;
        match_type: string;
        created_at: string;
    }
    | {
        id: string;
        game_title: string;
        starting_score: number;
        double_in: boolean;
        double_out: boolean;
        match_type: string;
        created_at: string;
    }[]
    | null;
};

function formatAverage(totalScore: number, totalTurns: number) {
    if (totalTurns <= 0) {
        return "0.0";
    }

    return (totalScore / totalTurns).toFixed(1);
}

function formatWinRate(wins: number, matches: number) {
    if (matches <= 0) {
        return "0%";
    }

    return `${Math.round((wins / matches) * 100)}%`;
}

function normalizeMatchResult(match: RecentMatchRow["match_results"]) {
    if (!match) {
        return null;
    }

    if (Array.isArray(match)) {
        return match[0] ?? null;
    }

    return match;
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function ProfileScreen() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [recentMatches, setRecentMatches] = useState<RecentMatchRow[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadProfileData();
        }, [])
    );

    async function loadProfileData() {
        setIsRefreshing(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setIsRefreshing(false);
            router.replace("/login");
            return;
        }

        const profileResult = await getCurrentUserProfile();

        if (profileResult.error) {
            Alert.alert("Profile failed", profileResult.error);
            setIsRefreshing(false);
            return;
        }

        if (!profileResult.profile) {
            setIsRefreshing(false);
            router.replace("/profile-setup");
            return;
        }

        const statsResult = await ensureCurrentUserStats();

        if (statsResult.error) {
            Alert.alert("Stats failed", statsResult.error);
            setIsRefreshing(false);
            return;
        }

        const recentResult = await getRecentMatchResults(8);

        if (recentResult.error) {
            Alert.alert("Recent matches failed", recentResult.error);
            setIsRefreshing(false);
            return;
        }

        setProfile(profileResult.profile);
        setStats(statsResult.stats);
        setRecentMatches(recentResult.matches as RecentMatchRow[]);
        setIsRefreshing(false);
    }

    const matchesPlayed = stats?.matches_played ?? 0;
    const matchesWon = stats?.matches_won ?? 0;
    const matchesLost = stats?.matches_lost ?? 0;
    const averageScore = formatAverage(
        stats?.total_score ?? 0,
        stats?.total_turns ?? 0
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={loadProfileData} />
                }
            >
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} hitSlop={12}>
                        <Text style={styles.backText}>← Back</Text>
                    </Pressable>

                    <Text style={styles.eyebrow}>Player profile</Text>
                    <Text style={styles.title}>
                        @{profile?.username ?? "loading"}
                    </Text>
                    <Text style={styles.subtitle}>
                        Your lifetime stats and recent match history.
                    </Text>
                </View>

                <View style={styles.heroCard}>
                    <View>
                        <Text style={styles.heroLabel}>Win rate</Text>
                        <Text style={styles.heroValue}>
                            {formatWinRate(matchesWon, matchesPlayed)}
                        </Text>
                    </View>

                    <View style={styles.heroDivider} />

                    <View>
                        <Text style={styles.heroLabel}>Average</Text>
                        <Text style={styles.heroValue}>{averageScore}</Text>
                    </View>
                </View>

                <View style={styles.grid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Matches</Text>
                        <Text style={styles.statValue}>{matchesPlayed}</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Wins</Text>
                        <Text style={styles.statValue}>{matchesWon}</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Losses</Text>
                        <Text style={styles.statValue}>{matchesLost}</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Highest score</Text>
                        <Text style={styles.statValue}>{stats?.highest_score ?? 0}</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Highest checkout</Text>
                        <Text style={styles.statValue}>
                            {stats?.highest_checkout ?? 0}
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Turns</Text>
                        <Text style={styles.statValue}>{stats?.total_turns ?? 0}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent matches</Text>
                    </View>

                    {recentMatches.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyTitle}>No matches recorded yet</Text>
                            <Text style={styles.emptyText}>
                                Finish a local or remote match and it will appear here.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.matchList}>
                            {recentMatches.map((row) => {
                                const match = normalizeMatchResult(row.match_results);
                                const average = formatAverage(row.total_score, row.total_turns);

                                return (
                                    <View key={row.id} style={styles.matchCard}>
                                        <View style={styles.matchTop}>
                                            <View style={styles.matchMain}>
                                                <Text style={styles.matchTitle}>
                                                    {match?.game_title ?? "Match"}
                                                </Text>

                                                <Text style={styles.matchSubtitle}>
                                                    vs @{row.opponent_username ?? "Unknown"} ·{" "}
                                                    {match?.match_type ?? "match"}
                                                </Text>
                                            </View>

                                            <View
                                                style={[
                                                    styles.resultBadge,
                                                    row.won ? styles.winBadge : styles.lossBadge,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.resultBadgeText,
                                                        row.won ? styles.winBadgeText : styles.lossBadgeText,
                                                    ]}
                                                >
                                                    {row.won ? "Win" : "Loss"}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.matchStatsRow}>
                                            <Text style={styles.matchStatText}>Avg {average}</Text>
                                            <Text style={styles.matchStatText}>
                                                High {row.highest_score}
                                            </Text>
                                            <Text style={styles.matchStatText}>
                                                Checkout {row.highest_checkout}
                                            </Text>
                                        </View>

                                        <Text style={styles.matchDate}>
                                            {formatDate(match?.created_at ?? row.created_at)}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}
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
        marginBottom: 20,
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
    heroCard: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 22,
        padding: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        marginBottom: 14,
    },
    heroLabel: {
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 1,
        textAlign: "center",
    },
    heroValue: {
        color: "#f97316",
        fontSize: 34,
        fontWeight: "900",
        marginTop: 4,
        textAlign: "center",
    },
    heroDivider: {
        width: 1,
        height: 48,
        backgroundColor: "#334155",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 24,
    },
    statCard: {
        width: "48%",
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 18,
        padding: 14,
    },
    statLabel: {
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    statValue: {
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "900",
        marginTop: 6,
    },
    section: {
        marginTop: 2,
    },
    sectionHeader: {
        marginBottom: 10,
    },
    sectionTitle: {
        color: "#ffffff",
        fontSize: 19,
        fontWeight: "900",
    },
    emptyCard: {
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 18,
        padding: 16,
    },
    emptyTitle: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "900",
    },
    emptyText: {
        color: "#94a3b8",
        fontSize: 14,
        fontWeight: "600",
        lineHeight: 20,
        marginTop: 4,
    },
    matchList: {
        gap: 10,
    },
    matchCard: {
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 18,
        padding: 14,
    },
    matchTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    matchMain: {
        flex: 1,
    },
    matchTitle: {
        color: "#ffffff",
        fontSize: 17,
        fontWeight: "900",
    },
    matchSubtitle: {
        color: "#94a3b8",
        fontSize: 13,
        fontWeight: "700",
        marginTop: 3,
    },
    resultBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    winBadge: {
        backgroundColor: "#f97316",
    },
    lossBadge: {
        backgroundColor: "#7f1d1d",
    },
    resultBadgeText: {
        fontSize: 12,
        fontWeight: "900",
    },
    winBadgeText: {
        color: "#111827",
    },
    lossBadgeText: {
        color: "#fecaca",
    },
    matchStatsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 12,
    },
    matchStatText: {
        color: "#fed7aa",
        backgroundColor: "#1e293b",
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 5,
        fontSize: 12,
        fontWeight: "900",
        overflow: "hidden",
    },
    matchDate: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "700",
        marginTop: 10,
    },
});