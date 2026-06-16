import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PlayerScoreCard } from "@/src/components/PlayerScoreCard";
import { ScoreInput } from "@/src/components/ScoreInput";
import { TurnHistory } from "@/src/components/TurnHistory";
import { applyTurn } from "@/src/lib/dartsScoring";
import { speakTurnResult } from "@/src/lib/voiceover";
import type { Player, Turn } from "@/src/types/darts";
import { CheckoutSuggestions } from "@/src/components/CheckoutSuggestions";

export default function X01Screen() {
    const params = useLocalSearchParams<{
        title?: string;
        startingScore?: string;
        doubleOut?: string;
    }>();

    const title = params.title ?? "501";
    const startingScore = Number(params.startingScore ?? 501);
    const doubleOut = params.doubleOut === "true";

    const [players, setPlayers] = useState<Player[]>([
        {
            id: "player-1",
            name: "Player 1",
            remaining: startingScore,
        },
        {
            id: "player-2",
            name: "Player 2",
            remaining: startingScore,
        },
    ]);

    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [scoreInput, setScoreInput] = useState("");
    const [turns, setTurns] = useState<Turn[]>([]);
    const [legFinished, setLegFinished] = useState(false);

    const currentPlayer = players[currentPlayerIndex];

    function getNextPlayerIndex() {
        return currentPlayerIndex === players.length - 1
            ? 0
            : currentPlayerIndex + 1;
    }

    function resetLeg(startingPlayerIndex = 0) {
        setPlayers((currentPlayers) =>
            currentPlayers.map((player) => ({
                ...player,
                remaining: startingScore,
            }))
        );

        setCurrentPlayerIndex(startingPlayerIndex);
        setScoreInput("");
        setTurns([]);
        setLegFinished(false);
    }

    function finishLeg(winnerName: string) {
        setLegFinished(true);
        setScoreInput("");

        Alert.alert("Leg finished", `${winnerName} wins the leg.`, [
            {
                text: "Start new leg",
                onPress: () => resetLeg(0),
            },
            {
                text: "Back to games",
                onPress: () => router.back(),
            },
        ]);
    }

    function submitScore() {
        if (legFinished) {
            Alert.alert("Leg already finished", "Start a new leg to continue.");
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

        speakTurnResult(
            currentPlayer.name,
            score,
            result.remainingAfter,
            result.bust,
            result.checkout
        );

        setTurns((currentTurns) => [turn, ...currentTurns]);
        setScoreInput("");

        if (!result.bust) {
            setPlayers((currentPlayers) =>
                currentPlayers.map((player) => {
                    if (player.id !== currentPlayer.id) {
                        return player;
                    }

                    return {
                        ...player,
                        remaining: result.remainingAfter,
                    };
                })
            );
        }

        if (result.checkout) {
            finishLeg(currentPlayer.name);
            return;
        }

        setCurrentPlayerIndex(getNextPlayerIndex());
    }

    function undoLastTurn() {
        if (legFinished) {
            return;
        }

        const [lastTurn, ...previousTurns] = turns;

        if (!lastTurn) {
            return;
        }

        setPlayers((currentPlayers) =>
            currentPlayers.map((player) => {
                if (player.id !== lastTurn.playerId) {
                    return player;
                }

                return {
                    ...player,
                    remaining: lastTurn.remainingBefore,
                };
            })
        );

        const previousPlayerIndex = players.findIndex(
            (player) => player.id === lastTurn.playerId
        );

        if (previousPlayerIndex !== -1) {
            setCurrentPlayerIndex(previousPlayerIndex);
        }

        setTurns(previousTurns);
    }

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <View>
                    <Pressable onPress={() => router.back()}>
                        <Text style={styles.backText}>← Games</Text>
                    </Pressable>

                    <Text style={styles.eyebrow}>
                        {doubleOut ? "Double out" : "Straight out"}
                    </Text>

                    <Text style={styles.title}>{title}</Text>
                </View>

                <Text style={styles.currentTurn}>
                    {legFinished ? "Leg finished" : currentPlayer.name}
                </Text>
            </View>

            <View style={styles.playersGrid}>
                {players.map((player, index) => (
                    <PlayerScoreCard
                        key={player.id}
                        player={player}
                        isActive={!legFinished && index === currentPlayerIndex}
                    />
                ))}
            </View>

            <CheckoutSuggestions
                remaining={currentPlayer.remaining}
                enabled={doubleOut && !legFinished}
            />

            <ScoreInput
                value={scoreInput}
                onChangeValue={setScoreInput}
                onSubmit={submitScore}
            />

            <View style={styles.actions}>
                <Pressable
                    style={[styles.secondaryButton, legFinished && styles.disabledButton]}
                    onPress={undoLastTurn}
                    disabled={legFinished}
                >
                    <Text style={styles.secondaryButtonText}>Undo</Text>
                </Pressable>

                <Pressable style={styles.secondaryButton} onPress={() => resetLeg(0)}>
                    <Text style={styles.secondaryButtonText}>
                        {legFinished ? "New leg" : "Reset"}
                    </Text>
                </Pressable>
            </View>

            <TurnHistory turns={turns} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#020617",
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 10,
    },
    header: {
        marginBottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    backText: {
        color: "#94a3b8",
        fontSize: 13,
        fontWeight: "800",
        marginBottom: 8,
    },
    eyebrow: {
        color: "#f97316",
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    title: {
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "900",
        marginTop: 2,
    },
    currentTurn: {
        color: "#fed7aa",
        fontSize: 14,
        fontWeight: "900",
        marginBottom: 3,
    },
    playersGrid: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 12,
    },
    actions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 10,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: "#111827",
        borderRadius: 14,
        paddingVertical: 11,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    disabledButton: {
        opacity: 0.45,
    },
    secondaryButtonText: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "800",
    },
});