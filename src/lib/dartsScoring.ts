export type TurnResult = {
  remainingAfter: number;
  bust: boolean;
  checkout: boolean;
  error: string | null;
};

type ApplyTurnOptions = {
  doubleOut: boolean;
};

export function applyTurn(
  remaining: number,
  score: number,
  options: ApplyTurnOptions
): TurnResult {
  const nextRemaining = remaining - score;

  if (!Number.isInteger(score) || score < 0 || score > 180) {
    return {
      remainingAfter: remaining,
      bust: true,
      checkout: false,
      error: "Score must be between 0 and 180.",
    };
  }

  if (nextRemaining < 0) {
    return {
      remainingAfter: remaining,
      bust: true,
      checkout: false,
      error: null,
    };
  }

  if (options.doubleOut && nextRemaining === 1) {
    return {
      remainingAfter: remaining,
      bust: true,
      checkout: false,
      error: null,
    };
  }

  if (nextRemaining === 0) {
    return {
      remainingAfter: 0,
      bust: false,
      checkout: true,
      error: null,
    };
  }

  return {
    remainingAfter: nextRemaining,
    bust: false,
    checkout: false,
    error: null,
  };
}