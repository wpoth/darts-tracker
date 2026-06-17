import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CheckoutSuggestions } from "@/src/components/CheckoutSuggestions";
import { ScoreInput } from "@/src/components/ScoreInput";
import { applyTurn } from "@/src/lib/dartsScoring";
import { speakTurnResult } from "@/src/lib/voiceover";
import type { Player, Turn } from "@/src/types/darts";

type PlayerMode = "solo" | "local-two" | "local-friend" | "remote";

export default function X01Screen() {
    const params = useLocalSearchParams<{
        title?: string;
        startingScore?: string;
        doubleIn?: string;
        doubleOut?: string;
        playerMode?: string;
        playerOneName?: string;
        playerTwoName?: string;
    }>();

    const title = params.title ?? "501";
    const startingScore = Number(params.startingScore ?? 501);
    const doubleIn = params.doubleIn === "true";
    const doubleOut = params.doubleOut === "true";
    const playerMode = (params.playerMode ?? "local-two") as PlayerMode;

    const isSolo = playerMode === "solo";

    const playerOneName = params.playerOneName ?? "Player 1";
    const playerTwoName = params.playerTwoName ?? "Player 2";

    const initialPlayers = useMemo<Player[]>(() => {
        if (isSolo) {
            return [
                {
                    id: "player-1",
                    name: playerOneName,
                    remaining: startingScore,
                },
            ];
        }

        return [
            {
                id: "player-1",
                name: playerOneName,
                remaining: startingScore,
            },
            {
                id: "player-2",
                name: playerTwoName,
                remaining: startingScore,
            },
        ];
    }, [isSolo, playerOneName, playerTwoName, startingScore]);

    const [players, setPlayers] = useState<Player[]>(initialPlayers);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [turns, setTurns] = useState<Turn[]>([]);
    const [scoreInput, setScoreInput] = useState("");
    const [legFinished, setLegFinished] = useState(false);

    const currentPlayer = players[currentPlayerIndex];

    function resetLeg(startingPlayerIndex = 0) {
        setPlayers(
            initialPlayers.map((player) => ({
                ...player,
                remaining: startingScore,
            }))
        );

        setCurrentPlayerIndex(isSolo ? 0 : startingPlayerIndex);
        setTurns([]);
        setScoreInput("");
        setLegFinished(false);
    }

    function goToGames() {
        router.push("/");
    }

    function finishLeg(winnerName: string) {
        setLegFinished(true);
        setScoreInput("");

        Alert.alert("Leg finished", `${winnerName} checked out.`, [
            {
                text: "Start new leg",
                onPress: () => resetLeg(0),
            },
            {
                text: "Back to games",
                onPress: goToGames,
            },
        ]);
    }

    function submitScore() {
        if (legFinished) {
            return;
        }

        if (!currentPlayer) {
            Alert.alert("Player missing", "Current player could not be found.");
            return;
        }

        const score = Number(scoreInput);

        const result = applyTurn(currentPlayer.remaining, score, {
            doubleOut,
        });

        if (result.error) {
            Alert.alert("Invalid score", result.error);
            return;
        }

        const turn: Turn = {
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            score,
            remainingBefore: currentPlayer.remaining,
            remainingAfter: result.remainingAfter,
            bust: result.bust,
            checkout: result.checkout,
        };

        setTurns((previousTurns) => [turn, ...previousTurns]);

        speakTurnResult(
            currentPlayer.name,
            score,
            result.remainingAfter,
            result.bust,
            result.checkout
        );

        if (!result.bust) {
            setPlayers((previousPlayers) =>
                previousPlayers.map((player) =>
                    player.id === currentPlayer.id
                        ? {
                            ...player,
                            remaining: result.remainingAfter,
                        }
                        : player
                )
            );
        }

        setScoreInput("");

        if (result.checkout) {
            finishLeg(currentPlayer.name);
            return;
        }

        if (!isSolo) {
            setCurrentPlayerIndex((previousIndex) =>
                previousIndex === players.length - 1 ? 0 : previousIndex + 1
            );
        }
    }

    const modeLabel = isSolo
        ? "Solo"
        : playerMode === "local-friend"
            ? "Local friend"
            : "Local two player";

    const rulesLabel = doubleOut ? "Double out" : "Straight out";

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
                        {modeLabel} · {rulesLabel}
                    </Text>

                    <Text style={styles.title}>{title}</Text>

                    <Text style={styles.subtitle}>
                        {legFinished
                            ? "Leg finished"
                            : isSolo
                                ? `Tracking ${currentPlayer?.name ?? "Player"}`
                                : `Current turn: ${currentPlayer?.name ?? "Unknown"}`}
                    </Text>

                    {doubleIn && (
                        <View style={styles.noticeCard}>
                            <Text style={styles.noticeTitle}>Double-in selected</Text>
                            <Text style={styles.noticeText}>
                                The setup flow supports this option, but double-in scoring logic
                                is not active yet.
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.playersGrid}>
                    {players.map((player, index) => {
                        const isActive = index === currentPlayerIndex && !legFinished;

                        return (
                            <View
                                key={player.id}
                                style={[styles.playerCard, isActive && styles.activePlayerCard]}
                            >
                                <Text style={[styles.playerName, isActive && styles.activeText]}>
                                    {player.name}
                                </Text>

                                <Text style={[styles.playerScore, isActive && styles.activeText]}>
                                    {player.remaining}
                                </Text>

                                {isActive && <Text style={styles.turnBadge}>Turn</Text>}
                            </View>
                        );
                    })}
                </View>

                {legFinished ? (
                    <View style={styles.finishedCard}>
                        <Text style={styles.finishedTitle}>Leg finished</Text>
                        <Text style={styles.finishedText}>
                            Start a new leg or go back to the game list.
                        </Text>

                        <View style={styles.finishedActions}>
                            <Pressable style={styles.primaryButton} onPress={() => resetLeg(0)}>
                                <Text style={styles.primaryButtonText}>New leg</Text>
                            </Pressable>

                            <Pressable style={styles.secondaryButton} onPress={goToGames}>
                                <Text style={styles.secondaryButtonText}>Games</Text>
                            </Pressable>
                        </View>
                    </View>
                ) : (
                    <>
                        <Text style={styles.turnStatus}>
                            {isSolo
                                ? "Enter your score"
                                : `${currentPlayer?.name ?? "Player"} is throwing`}
                        </Text>

                        <CheckoutSuggestions
                            remaining={currentPlayer?.remaining ?? 0}
                            enabled={Boolean(doubleOut && !legFinished)}
                        />

                        <ScoreInput
                            value={scoreInput}
                            onChangeValue={setScoreInput}
                            onSubmit={submitScore}
                        />
                    </>
                )}

                <View style={styles.history}>
                    <Text style={styles.historyTitle}>Last turns</Text>

                    {turns.length === 0 ? (
                        <Text style={styles.emptyText}>No turns yet.</Text>
                    ) : (
                        turns.slice(0, 6).map((turn, index) => (
                            <View key={`${turn.playerId}-${index}`} style={styles.turnRow}>
                                <View style={styles.turnMain}>
                                    <Text style={styles.turnText}>
                                        {turn.playerName}:{" "}
                                        {turn.checkout
                                            ? `Checkout ${turn.score}`
                                            : turn.bust
                                                ? "Bust"
                                                : turn.score}
                                    </Text>

                                    <Text style={styles.turnSubText}>
                                        {turn.remainingBefore} → {turn.remainingAfter}
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
    noticeCard: {
        backgroundColor: "#1e293b",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 14,
        padding: 12,
        marginTop: 12,
    },
    noticeTitle: {
        color: "#fed7aa",
        fontSize: 14,
        fontWeight: "900",
    },
    noticeText: {
        color: "#cbd5e1",
        fontSize: 13,
        fontWeight: "600",
        lineHeight: 19,
        marginTop: 3,
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
        color: "#94a3b8",
        fontSize: 14,
        fontWeight: "700",
        marginTop: 4,
        lineHeight: 20,
    },
    finishedActions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 14,
    },
    primaryButton: {
        backgroundColor: "#f97316",
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 9,
    },
    primaryButtonText: {
        color: "#111827",
        fontSize: 13,
        fontWeight: "900",
    },
    secondaryButton: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 9,
    },
    secondaryButtonText: {
        color: "#fed7aa",
        fontSize: 13,
        fontWeight: "900",
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