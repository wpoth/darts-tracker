import * as Speech from "expo-speech";

export function speakTurnResult(
    playerName: string,
    score: number,
    remainingAfter: number,
    bust: boolean,
    checkout: boolean
) {
    Speech.stop();

    const cleanName = playerName.replace("@", "");

    if (checkout) {
        Speech.speak(`${cleanName} checked out with ${score}.`, {
            rate: 0.9,
            pitch: 1,
            language: "en-US",
        });
        return;
    }

    if (bust) {
        Speech.speak(`${cleanName} scored ${score}. Bust.`, {
            rate: 0.9,
            pitch: 1,
            language: "en-US",
        });
        return;
    }

    Speech.speak(`${cleanName} scored ${score}. ${remainingAfter} remaining.`, {
        rate: 0.9,
        pitch: 1,
        language: "en-US",
    });
}

export function testVoiceover() {
    Speech.stop();

    Speech.speak("Voiceover is working.", {
        rate: 0.9,
        pitch: 1,
        language: "en-US",
    });
}