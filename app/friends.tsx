import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    getFriends,
    getIncomingFriendRequests,
    respondToFriendRequest,
    searchProfilesByUsername,
    sendFriendRequest,
    type FriendProfile,
} from "@/src/lib/friendsDatabase";

import {
    getIncomingMatchInvites,
    getMyMatchInvites,
    respondToMatchInvite,
    type MatchInvite,
} from "@/src/lib/matchInvitesDatabase";

type IncomingRequest = {
    id: string;
    sender_id: string;
    receiver_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    sender: FriendProfile | null;
};

export default function FriendsScreen() {
    const [myMatchInvites, setMyMatchInvites] = useState<MatchInvite[]>([]);
    const [matchInvites, setMatchInvites] = useState<MatchInvite[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>(
        []
    );
    const [friends, setFriends] = useState<FriendProfile[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadFriendsData();
        }, [])
    );

    async function loadFriendsData() {
        setIsLoading(true);

        const incomingResult = await getIncomingFriendRequests();
        const friendsResult = await getFriends();
        const matchInvitesResult = await getIncomingMatchInvites();
        const myMatchInvitesResult = await getMyMatchInvites();

        if (incomingResult.error) {
            Alert.alert("Requests failed", incomingResult.error);
        } else {
            setIncomingRequests(incomingResult.requests as IncomingRequest[]);
        }

        if (friendsResult.error) {
            Alert.alert("Friends failed", friendsResult.error);
        } else {
            setFriends(friendsResult.friends);
        }

        if (matchInvitesResult.error) {
            Alert.alert("Match invites failed", matchInvitesResult.error);
        } else {
            setMatchInvites(matchInvitesResult.invites);
        }

        if (myMatchInvitesResult.error) {
            Alert.alert("Your match invites failed", myMatchInvitesResult.error);
        } else {
            setMyMatchInvites(myMatchInvitesResult.invites);
        }

        setIsLoading(false);
    }

    function openMatchRoom(matchRoomId: string | null) {
        if (!matchRoomId) {
            Alert.alert("Match unavailable", "This invite has no match room.");
            return;
        }

        router.push({
            pathname: "/match-room/[id]",
            params: {
                id: matchRoomId,
            },
        });
    }

    async function handleSearch(value: string) {
        setSearchQuery(value);

        if (value.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const { profiles, error } = await searchProfilesByUsername(value);

        if (error) {
            Alert.alert("Search failed", error);
            return;
        }

        setSearchResults(profiles);
    }

    async function handleSendFriendRequest(profile: FriendProfile) {
        const { error } = await sendFriendRequest(profile.id);

        if (error) {
            Alert.alert("Request failed", error);
            return;
        }

        Alert.alert("Request sent", `Friend request sent to @${profile.username}.`);
        setSearchQuery("");
        setSearchResults([]);
    }

    async function handleRespondToMatchInvite(
        inviteId: string,
        status: "accepted" | "declined"
    ) {
        const { invite, error } = await respondToMatchInvite(inviteId, status);

        if (error) {
            Alert.alert("Invite failed", error);
            return;
        }

        if (status === "accepted" && invite?.match_room_id) {
            router.push({
                pathname: "/match-room/[id]",
                params: {
                    id: invite.match_room_id,
                },
            });

            return;
        }

        await loadFriendsData();
    }

    async function handleRespondToRequest(
        requestId: string,
        status: "accepted" | "declined"
    ) {
        const { error } = await respondToFriendRequest(requestId, status);

        if (error) {
            Alert.alert("Request failed", error);
            return;
        }

        await loadFriendsData();
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} hitSlop={12}>
                        <Text style={styles.backText}>← Back</Text>
                    </Pressable>

                    <Text style={styles.eyebrow}>Social</Text>
                    <Text style={styles.title}>Friends</Text>
                    <Text style={styles.subtitle}>
                        Add friends by username and manage requests.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Find user</Text>

                    <TextInput
                        value={searchQuery}
                        onChangeText={handleSearch}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="Search username"
                        placeholderTextColor="#64748b"
                        style={styles.input}
                    />

                    <View style={styles.list}>
                        {searchQuery.trim().length >= 2 && searchResults.length === 0 ? (
                            <Text style={styles.emptyText}>No users found.</Text>
                        ) : (
                            searchResults.map((profile) => (
                                <View key={profile.id} style={styles.row}>
                                    <View style={styles.rowText}>
                                        <Text style={styles.primaryText}>@{profile.username}</Text>
                                        <Text style={styles.secondaryText}>Darts player</Text>
                                    </View>

                                    <Pressable
                                        style={styles.smallButton}
                                        onPress={() => handleSendFriendRequest(profile)}
                                    >
                                        <Text style={styles.smallButtonText}>Add</Text>
                                    </Pressable>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Match invites</Text>

                    <View style={styles.list}>
                        {matchInvites.length === 0 ? (
                            <Text style={styles.emptyText}>No match invites.</Text>
                        ) : (
                            matchInvites.map((invite) => (
                                <View key={invite.id} style={styles.requestCard}>
                                    <View style={styles.rowText}>
                                        <Text style={styles.primaryText}>
                                            @{invite.sender?.username ?? "Unknown user"}
                                        </Text>
                                        <Text style={styles.secondaryText}>
                                            Invited you to {invite.game_title} ·{" "}
                                            {invite.double_out ? "Double out" : "Straight out"}
                                        </Text>
                                    </View>

                                    <View style={styles.requestActions}>
                                        <Pressable
                                            style={styles.acceptButton}
                                            onPress={() =>
                                                handleRespondToMatchInvite(invite.id, "accepted")
                                            }
                                        >
                                            <Text style={styles.acceptButtonText}>Accept</Text>
                                        </Pressable>

                                        <Pressable
                                            style={styles.declineButton}
                                            onPress={() =>
                                                handleRespondToMatchInvite(invite.id, "declined")
                                            }
                                        >
                                            <Text style={styles.declineButtonText}>Decline</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your match invites</Text>

                    <View style={styles.list}>
                        {myMatchInvites.length === 0 ? (
                            <Text style={styles.emptyText}>No sent match invites.</Text>
                        ) : (
                            myMatchInvites.map((invite) => (
                                <View key={invite.id} style={styles.requestCard}>
                                    <View style={styles.rowText}>
                                        <Text style={styles.primaryText}>
                                            @{invite.receiver?.username ?? "Unknown user"}
                                        </Text>

                                        <Text style={styles.secondaryText}>
                                            {invite.game_title} ·{" "}
                                            {invite.double_out ? "Double out" : "Straight out"}
                                        </Text>

                                        <Text style={styles.statusText}>
                                            Status: {invite.status}
                                        </Text>
                                    </View>

                                    {invite.status === "accepted" ? (
                                        <Pressable
                                            style={styles.acceptButton}
                                            onPress={() => openMatchRoom(invite.match_room_id)}
                                        >
                                            <Text style={styles.acceptButtonText}>Open match</Text>
                                        </Pressable>
                                    ) : (
                                        <View style={styles.pendingBadge}>
                                            <Text style={styles.pendingBadgeText}>Waiting</Text>
                                        </View>
                                    )}
                                </View>
                            ))
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Incoming requests</Text>

                        <Pressable onPress={loadFriendsData} disabled={isLoading}>
                            <Text style={styles.refreshText}>
                                {isLoading ? "Loading..." : "Refresh"}
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.list}>
                        {incomingRequests.length === 0 ? (
                            <Text style={styles.emptyText}>No pending requests.</Text>
                        ) : (
                            incomingRequests.map((request) => (
                                <View key={request.id} style={styles.requestCard}>
                                    <View style={styles.rowText}>
                                        <Text style={styles.primaryText}>
                                            @{request.sender?.username ?? "Unknown user"}
                                        </Text>
                                        <Text style={styles.secondaryText}>
                                            Wants to be friends
                                        </Text>
                                    </View>

                                    <View style={styles.requestActions}>
                                        <Pressable
                                            style={styles.acceptButton}
                                            onPress={() =>
                                                handleRespondToRequest(request.id, "accepted")
                                            }
                                        >
                                            <Text style={styles.acceptButtonText}>Accept</Text>
                                        </Pressable>

                                        <Pressable
                                            style={styles.declineButton}
                                            onPress={() =>
                                                handleRespondToRequest(request.id, "declined")
                                            }
                                        >
                                            <Text style={styles.declineButtonText}>Decline</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your friends</Text>

                    <View style={styles.list}>
                        {friends.length === 0 ? (
                            <Text style={styles.emptyText}>No friends yet.</Text>
                        ) : (
                            friends.map((friend) => (
                                <View key={friend.id} style={styles.row}>
                                    <View style={styles.rowText}>
                                        <Text style={styles.primaryText}>@{friend.username}</Text>
                                        <Text style={styles.secondaryText}>Friend</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
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
    section: {
        marginBottom: 24,
    },
    sectionHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sectionTitle: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "900",
        marginBottom: 10,
    },
    refreshText: {
        color: "#fed7aa",
        fontSize: 13,
        fontWeight: "900",
        marginBottom: 10,
    },
    input: {
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "#334155",
        color: "#ffffff",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 15,
        fontSize: 16,
    },
    list: {
        gap: 10,
        marginTop: 10,
    },
    row: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 16,
        padding: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
    },
    requestCard: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 16,
        padding: 14,
        gap: 12,
    },
    rowText: {
        flex: 1,
    },
    primaryText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "900",
    },
    secondaryText: {
        color: "#94a3b8",
        fontSize: 13,
        fontWeight: "700",
        marginTop: 3,
    },
    smallButton: {
        backgroundColor: "#f97316",
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    smallButtonText: {
        color: "#111827",
        fontSize: 13,
        fontWeight: "900",
    },
    requestActions: {
        flexDirection: "row",
        gap: 10,
    },
    acceptButton: {
        flex: 1,
        backgroundColor: "#f97316",
        borderRadius: 14,
        paddingVertical: 11,
        alignItems: "center",
    },
    acceptButtonText: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "900",
    },
    declineButton: {
        flex: 1,
        backgroundColor: "#1e293b",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 14,
        paddingVertical: 11,
        alignItems: "center",
    },
    declineButtonText: {
        color: "#cbd5e1",
        fontSize: 14,
        fontWeight: "900",
    },
    emptyText: {
        color: "#64748b",
        fontSize: 14,
        fontWeight: "700",
    },
    statusText: {
        color: "#fed7aa",
        fontSize: 12,
        fontWeight: "800",
        marginTop: 5,
        textTransform: "capitalize",
    },
    pendingBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#1e293b",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    pendingBadgeText: {
        color: "#cbd5e1",
        fontSize: 12,
        fontWeight: "900",
    },
});