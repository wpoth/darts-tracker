import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { recordRemoteMatchResult } from "@/src/lib/matchResultsDatabase";
import { CheckoutSuggestions } from "@/src/components/CheckoutSuggestions";
import { ScoreInput } from "@/src/components/ScoreInput";
import {
    getMatchRoomState,
    submitMatchRoomScore,
    type MatchRoom,
    type MatchRoomPlayer,
    type MatchRoomTurn,
} from "@/src/lib/matchRoomsDatabase";
import { supabase } from "@/src/lib/supabase";
import { speakTurnResult } from "@/src/lib/voiceover";

export default function MatchRoomScreen() {
    const params = useLocalSearchParams<{ id?: string }>();
    const matchRoomId = params.id;

    const [room, setRoom] = useState<MatchRoom | null>(null);
    const [players, setPlayers] = useState<MatchRoomPlayer[]>([]);
    const [turns, setTurns] = useState<MatchRoomTurn[]>([]);
    const [scoreInput, setScoreInput] = useState("");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const lastSpokenTurnIdRef = useRef<string | null>(null);
    const lastSubmittedTurnIdRef = useRef<string | null>(null);
    const hasLoadedInitialTurnsRef = useRef(false);

    useEffect(() => {
        loadInitialData();
    }, [matchRoomId]);

    useEffect(() => {
        if (!matchRoomId) {
            return;
        }

        const channel = supabase
            .channel(`match-room-${matchRoomId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "match_rooms",
                    filter: `id=eq.${matchRoomId}`,
                },
                () => {
                    loadRoomState();
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "match_room_players",
                    filter: `match_room_id=eq.${matchRoomId}`,
                },
                () => {
                    loadRoomState();
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "match_room_turns",
                    filter: `match_room_id=eq.${matchRoomId}`,
                },
                () => {
                    loadRoomState({ speakLatestTurn: true });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [matchRoomId]);

    async function loadInitialData() {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        setCurrentUserId(user?.id ?? null);
        await loadRoomState();
    }

    async function loadRoomState(options?: { speakLatestTurn?: boolean }) {
        if (!matchRoomId) {
            return;
        }

        const {
            room: currentRoom,
            players: currentPlayers,
            turns: currentTurns,
            error,
        } = await getMatchRoomState(matchRoomId);

        if (error) {
            Alert.alert("Match failed", error);
            return;
        }

        setRoom(currentRoom);
        setPlayers(currentPlayers);
        setTurns(currentTurns);

        if (currentRoom?.status === "finished") {
            await recordRemoteMatchResult({
                room: currentRoom,
                players: currentPlayers,
                turns: currentTurns,
            });
        }
        const latestTurn = currentTurns[0];

        if (!hasLoadedInitialTurnsRef.current) {
            hasLoadedInitialTurnsRef.current = true;
            lastSpokenTurnIdRef.current = latestTurn?.id ?? null;
            return;
        }

        if (!options?.speakLatestTurn || !latestTurn) {
            return;
        }

        if (latestTurn.id === lastSpokenTurnIdRef.current) {
            return;
        }

        if (latestTurn.id === lastSubmittedTurnIdRef.current) {
            lastSpokenTurnIdRef.current = latestTurn.id;
            lastSubmittedTurnIdRef.current = null;
            return;
        }

        lastSpokenTurnIdRef.current = latestTurn.id;

        speakTurnResult(
            latestTurn.username,
            latestTurn.score,
            latestTurn.remaining_after,
            latestTurn.bust,
            latestTurn.checkout
        );
    }

    async function submitScore() {
        if (!matchRoomId) {
            return;
        }

        if (!room) {
            Alert.alert("Match unavailable", "The match has not loaded yet.");
            return;
        }

        const score = Number(scoreInput);

        const playerBeforeSubmit = players.find(
            (player) => player.profile_id === currentUserId
        );

        if (!playerBeforeSubmit) {
            Alert.alert("Player missing", "You are not a player in this match.");
            return;
        }

        const { turn, error } = await submitMatchRoomScore(matchRoomId, score);

        if (error) {
            Alert.alert("Score failed", error);
            return;
        }

        if (turn) {
            lastSubmittedTurnIdRef.current = turn.id;
            lastSpokenTurnIdRef.current = turn.id;

            speakTurnResult(
                turn.username,
                turn.score,
                turn.remaining_after,
                turn.bust,
                turn.checkout
            );
        }

        setScoreInput("");
        await loadRoomState();
    }
    const currentPlayer = players.find(
        (player) => player.profile_id === room?.current_player_id
    );

    const isYourTurn = currentUserId === room?.current_player_id;
    const isPending = room?.status === "pending";
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

                    <Text style={styles.eyebrow}>
                        {room?.double_out ? "Double out" : "Straight out"}
                    </Text>

                    <Text style={styles.title}>{room?.game_title ?? "Match"}</Text>

                    <Text style={styles.subtitle}>
                        {room?.status === "finished"
                            ? "Match finished"
                            : `Current turn: ${currentPlayer?.username ?? "Unknown"}`}
                    </Text>
                </View>

                <View style={styles.playersGrid}>
                    {players.map((player) => {
                        const isActive = player.profile_id === room?.current_player_id;

                        return (
                            <View
                                key={player.id}
                                style={[styles.playerCard, isActive && styles.activePlayerCard]}
                            >
                                <Text style={[styles.playerName, isActive && styles.activeText]}>
                                    @{player.username}
                                </Text>

                                <Text style={[styles.playerScore, isActive && styles.activeText]}>
                                    {player.remaining}
                                </Text>

                                {isActive && <Text style={styles.turnBadge}>Turn</Text>}
                            </View>
                        );
                    })}
                </View>

                {room?.status === "finished" ? (
                    <View style={styles.finishedCard}>
                        <Text style={styles.finishedTitle}>Match finished</Text>
                        <Text style={styles.finishedText}>
                            Winner:{" "}
                            {players.find((player) => player.profile_id === room.winner_id)
                                ?.username ?? "Unknown"}
                        </Text>
                    </View>
                ) : isPending ? (
                    <View style={styles.waitingCard}>
                        <Text style={styles.waitingTitle}>Waiting for opponent</Text>
                        <Text style={styles.waitingText}>
                            The match room is ready. Your friend needs to accept the invite before the
                            match starts.
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.turnStatus}>
                            {isYourTurn ? "Your turn" : "Waiting for opponent"}
                        </Text>

                        <CheckoutSuggestions
                            remaining={currentPlayer?.remaining ?? 0}
                            enabled={Boolean(room?.double_out && !room?.winner_id)}
                        />

                        {isYourTurn ? (
                            <ScoreInput
                                value={scoreInput}
                                onChangeValue={setScoreInput}
                                onSubmit={submitScore}
                            />
                        ) : (
                            <View style={styles.waitingCard}>
                                <Text style={styles.waitingTitle}>Waiting</Text>
                                <Text style={styles.waitingText}>
                                    @{currentPlayer?.username ?? "Opponent"} is throwing.
                                </Text>
                            </View>
                        )}
                    </>
                )}

                <View style={styles.history}>
                    <Text style={styles.historyTitle}>Last turns</Text>

                    {turns.length === 0 ? (
                        <Text style={styles.emptyText}>No turns yet.</Text>
                    ) : (
                        turns.slice(0, 6).map((turn) => (
                            <View key={turn.id} style={styles.turnRow}>
                                <View style={styles.turnMain}>
                                    <Text style={styles.turnText}>
                                        @{turn.username}:{" "}
                                        {turn.checkout
                                            ? `Checkout ${turn.score}`
                                            : turn.bust
                                                ? "Bust"
                                                : turn.score}
                                    </Text>

                                    <Text style={styles.turnSubText}>
                                        {turn.remaining_before} → {turn.remaining_after}
                                    </Text>
                                </View>

                                {turn.checkout && (
                                    <View style={styles.checkoutBadge}>
                                        <Text style={styles.checkoutBadgeText}>Win</Text>
                                    </View>
                                )}

                                {turn.bust && (
                                    <View style={styles.bustBadge}>
                                        <Text style={styles.bustBadgeText}>Bust</Text>
                                    </View>
                                )}
                            </View>
                        ))
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
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 28,
    },
    header: {
        marginBottom: 10,
    },
    backText: {
        color: "#94a3b8",
        fontSize: 14,
        fontWeight: "800",
        marginBottom: 12,
    },
    eyebrow: {
        color: "#f97316",
        fontSize: 12,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    title: {
        color: "#ffffff",
        fontSize: 30,
        fontWeight: "900",
        marginTop: 2,
    },
    subtitle: {
        color: "#94a3b8",
        fontSize: 14,
        fontWeight: "700",
        marginTop: 4,
        lineHeight: 20,
    },
    playersGrid: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 10,
    },
    playerCard: {
        flex: 1,
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 16,
        padding: 12,
        minWidth: 0,
    },
    activePlayerCard: {
        borderColor: "#f97316",
        backgroundColor: "#1f2937",
    },
    playerName: {
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: "900",
    },
    playerScore: {
        color: "#ffffff",
        fontSize: 36,
        fontWeight: "900",
        marginTop: 2,
    },
    activeText: {
        color: "#f97316",
    },
    turnBadge: {
        alignSelf: "flex-start",
        color: "#111827",
        backgroundColor: "#f97316",
        fontSize: 11,
        fontWeight: "900",
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 999,
        marginTop: 6,
        overflow: "hidden",
    },
    turnStatus: {
        color: "#fed7aa",
        fontSize: 14,
        fontWeight: "900",
        marginBottom: 8,
    },
    finishedCard: {
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 16,
        padding: 14,
    },
    finishedTitle: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "900",
    },
    finishedText: {
        color: "#fed7aa",
        fontSize: 14,
        fontWeight: "800",
        marginTop: 4,
    },
    waitingCard: {
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 16,
        padding: 14,
    },
    waitingTitle: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "900",
    },
    waitingText: {
        color: "#94a3b8",
        fontSize: 14,
        fontWeight: "700",
        marginTop: 4,
    },
    history: {
        marginTop: 12,
    },
    historyTitle: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "900",
        marginBottom: 8,
    },
    emptyText: {
        color: "#64748b",
        fontSize: 14,
        fontWeight: "700",
    },
    turnRow: {
        backgroundColor: "#0f172a",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 9,
        marginBottom: 6,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    turnMain: {
        flex: 1,
    },
    turnText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "800",
    },
    turnSubText: {
        color: "#94a3b8",
        fontSize: 13,
        fontWeight: "700",
        marginTop: 2,
    },
    checkoutBadge: {
        backgroundColor: "#f97316",
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 5,
    },
    checkoutBadgeText: {
        color: "#111827",
        fontSize: 11,
        fontWeight: "900",
    },
    bustBadge: {
        backgroundColor: "#7f1d1d",
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 5,
    },
    bustBadgeText: {
        color: "#fecaca",
        fontSize: 11,
        fontWeight: "900",
    },
});