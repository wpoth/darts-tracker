export type CheckoutSuggestion = {
    darts: string[];
    total: number;
};

type DartOption = {
    label: string;
    score: number;
};

const finishingDarts: DartOption[] = [
    { label: "D20", score: 40 },
    { label: "D16", score: 32 },
    { label: "D18", score: 36 },
    { label: "D12", score: 24 },
    { label: "D10", score: 20 },
    { label: "D8", score: 16 },
    { label: "D4", score: 8 },
    { label: "D2", score: 4 },
    { label: "D1", score: 2 },
    { label: "Bull", score: 50 },
    { label: "D19", score: 38 },
    { label: "D17", score: 34 },
    { label: "D15", score: 30 },
    { label: "D14", score: 28 },
    { label: "D13", score: 26 },
    { label: "D11", score: 22 },
    { label: "D9", score: 18 },
    { label: "D7", score: 14 },
    { label: "D6", score: 12 },
    { label: "D5", score: 10 },
    { label: "D3", score: 6 },
];

const setupDarts: DartOption[] = [
    { label: "T20", score: 60 },
    { label: "T19", score: 57 },
    { label: "T18", score: 54 },
    { label: "T17", score: 51 },
    { label: "T16", score: 48 },
    { label: "T15", score: 45 },
    { label: "T14", score: 42 },
    { label: "T13", score: 39 },
    { label: "T12", score: 36 },
    { label: "T11", score: 33 },
    { label: "T10", score: 30 },
    { label: "T9", score: 27 },
    { label: "T8", score: 24 },
    { label: "T7", score: 21 },
    { label: "T6", score: 18 },
    { label: "T5", score: 15 },
    { label: "T4", score: 12 },
    { label: "T3", score: 9 },
    { label: "T2", score: 6 },
    { label: "T1", score: 3 },

    { label: "Bull", score: 50 },

    { label: "20", score: 20 },
    { label: "19", score: 19 },
    { label: "18", score: 18 },
    { label: "17", score: 17 },
    { label: "16", score: 16 },
    { label: "15", score: 15 },
    { label: "14", score: 14 },
    { label: "13", score: 13 },
    { label: "12", score: 12 },
    { label: "11", score: 11 },
    { label: "10", score: 10 },
    { label: "9", score: 9 },
    { label: "8", score: 8 },
    { label: "7", score: 7 },
    { label: "6", score: 6 },
    { label: "5", score: 5 },
    { label: "4", score: 4 },
    { label: "3", score: 3 },
    { label: "2", score: 2 },
    { label: "1", score: 1 },
];

export function getCheckoutSuggestions(
    remaining: number,
    maxSuggestions = 3
): CheckoutSuggestion[] {
    if (remaining < 2 || remaining > 170) {
        return [];
    }

    const suggestions: CheckoutSuggestion[] = [];

    for (const finish of finishingDarts) {
        if (finish.score === remaining) {
            suggestions.push({
                darts: [finish.label],
                total: remaining,
            });
        }
    }

    for (const first of setupDarts) {
        for (const finish of finishingDarts) {
            if (first.score + finish.score === remaining) {
                suggestions.push({
                    darts: [first.label, finish.label],
                    total: remaining,
                });
            }
        }
    }

    for (const first of setupDarts) {
        for (const second of setupDarts) {
            for (const finish of finishingDarts) {
                if (first.score + second.score + finish.score === remaining) {
                    suggestions.push({
                        darts: [first.label, second.label, finish.label],
                        total: remaining,
                    });
                }
            }
        }
    }

    return removeDuplicateSuggestions(suggestions).slice(0, maxSuggestions);
}

function removeDuplicateSuggestions(
    suggestions: CheckoutSuggestion[]
): CheckoutSuggestion[] {
    const seen = new Set<string>();

    return suggestions.filter((suggestion) => {
        const key = suggestion.darts.join("-");

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}