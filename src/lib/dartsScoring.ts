export type TurnResult = {
  remainingAfter: number;
  bust: boolean;
  error: string | null;
};

export function applyTurn(remaining: number, score: number): TurnResult {
  const nextRemaining = remaining - score;

  if (!Number.isInteger(score) || score < 0 || score > 180) {
    return {
      remainingAfter: remaining,
      bust: true,
      error: "Score must be between 0 and 180.",
    };
  }

  if (nextRemaining < 0 || nextRemaining === 1) {
    return {
      remainingAfter: remaining,
      bust: true,
      error: null,
    };
  }

  return {
    remainingAfter: nextRemaining,
    bust: false,
    error: null,
  };
}