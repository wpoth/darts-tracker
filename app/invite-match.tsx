import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getFriends, type FriendProfile } from "@/src/lib/friendsDatabase";
import { sendMatchInvite } from "@/src/lib/matchInvitesDatabase";

export default function InviteMatchScreen() {
    const params = useLocalSearchParams<{
        title?: string;
        startingScore?: string;
        doubleIn?: string;
        doubleOut?: string;
        playerMode?: string;
    }>();

    const doubleIn = params.doubleIn ?? "false";
    const title = params.title ?? "501";
    const startingScore = Number(params.startingScore ?? 501);
    const doubleOut = params.doubleOut === "true";

    const [friends, setFriends] = useState<FriendProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadFriends();
    }, []);

    async function loadFriends() {
        setIsLoading(true);

        const { friends: currentFriends, error } = await getFriends();

        if (error) {
            Alert.alert("Friends failed", error);
        } else {
            setFriends(currentFriends);
        }

        setIsLoading(false);
    }

    async function inviteFriend(friend: FriendProfile) {
        const { error } = await sendMatchInvite({
            receiverId: friend.id,
            gameTitle: title,
            startingScore,
            doubleOut,
        });

        if (error) {
            Alert.alert("Invite failed", error);
            return;
        }

        Alert.alert("Invite sent", `Match invite sent to @${friend.username}.`, [
            {
                text: "Back to games",
                onPress: () => router.replace("/"),
            },
        ]);
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

                    <Text style={styles.eyebrow}>Invite friend</Text>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>
                        Choose a friend to invite to this match.
                    </Text>
                </View>

                <View style={styles.matchCard}>
                    <Text style={styles.matchLabel}>Match setup</Text>
                    <Text style={styles.matchTitle}>{title}</Text>
                    <Text style={styles.matchMeta}>
                        {startingScore} · {doubleIn === "true" ? "Double in · " : ""}
                        {doubleOut ? "Double out" : "Straight out"}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your friends</Text>

                    {isLoading ? (
                        <Text style={styles.emptyText}>Loading friends...</Text>
                    ) : friends.length === 0 ? (
                        <Text style={styles.emptyText}>
                            You need to add a friend before inviting someone.
                        </Text>
                    ) : (
                        <View style={styles.list}>
                            {friends.map((friend) => (
                                <View key={friend.id} style={styles.friendRow}>
                                    <View style={styles.friendText}>
                                        <Text style={styles.friendName}>@{friend.username}</Text>
                                        <Text style={styles.friendSubText}>Available friend</Text>
                                    </View>

                                    <Pressable
                                        style={styles.inviteButton}
                                        onPress={() => inviteFriend(friend)}
                                    >
                                        <Text style={styles.inviteButtonText}>Invite</Text>
                                    </Pressable>
                                </View>
                            ))}
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
        paddingTop: 8,
        paddingBottom: 28,
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
        letterSpacing: 1,
        marginBottom: 4,
    },
    title: {
        color: "#ffffff",
        fontSize: 34,
        fontWeight: "900",
    },
    subtitle: {
        color: "#94a3b8",
        fontSize: 15,
        fontWeight: "600",
        marginTop: 6,
        lineHeight: 21,
    },
    matchCard: {
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 18,
        padding: 14,
        marginBottom: 22,
    },
    matchLabel: {
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 4,
    },
    matchTitle: {
        color: "#ffffff",
        fontSize: 24,
        fontWeight: "900",
    },
    matchMeta: {
        color: "#fed7aa",
        fontSize: 14,
        fontWeight: "800",
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "900",
        marginBottom: 10,
    },
    list: {
        gap: 10,
    },
    friendRow: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 16,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    friendText: {
        flex: 1,
    },
    friendName: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "900",
    },
    friendSubText: {
        color: "#94a3b8",
        fontSize: 13,
        fontWeight: "700",
        marginTop: 3,
    },
    inviteButton: {
        backgroundColor: "#f97316",
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    inviteButtonText: {
        color: "#111827",
        fontSize: 13,
        fontWeight: "900",
    },
    emptyText: {
        color: "#64748b",
        fontSize: 14,
        fontWeight: "700",
        lineHeight: 20,
    },
});