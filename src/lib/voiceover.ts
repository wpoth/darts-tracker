import * as Speech from "expo-speech";

export function speakTurnResult(
    playerName: string,
    score: number,
    remainingAfter: number,
    bust: boolean,
    checkout: boolean
) {
    Speech.stop();

    if (checkout) {
        Speech.speak(`${playerName} checked out with ${score}.`, {
            rate: 0.95,
            pitch: 1,
        });

        return;
    }

    if (bust) {
        Speech.speak(`${playerName} scored ${score}. Bust.`, {
            rate: 0.95,
            pitch: 1,
        });

        return;
    }

    Speech.speak(`${playerName} scored ${score}. ${remainingAfter} remaining.`, {
        rate: 0.95,
        pitch: 1,
    });
}