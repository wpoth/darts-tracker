export type TurnResult = {
  remainingAfter: number;
  bust: boolean;
  checkout: boolean;
  needsDoubleConfirmation: boolean;
  error: string | null;
};

type ApplyTurnOptions = {
  requiresDoubleOut?: boolean;
  finishedOnDouble?: boolean;
};

export function applyTurn(
  remaining: number,
  score: number,
  options: ApplyTurnOptions = {}
): TurnResult {
  const { requiresDoubleOut = true, finishedOnDouble = false } = options;
  const nextRemaining = remaining - score;

  if (!Number.isInteger(score) || score < 0 || score > 180) {
    return {
      remainingAfter: remaining,
      bust: true,
      checkout: false,
      needsDoubleConfirmation: false,
      error: "Score must be between 0 and 180.",
    };
  }

  if (nextRemaining < 0 || nextRemaining === 1) {
    return {
      remainingAfter: remaining,
      bust: true,
      checkout: false,
      needsDoubleConfirmation: false,
      error: null,
    };
  }

  if (nextRemaining === 0) {
    if (requiresDoubleOut && !finishedOnDouble) {
      return {
        remainingAfter: remaining,
        bust: true,
        checkout: false,
        needsDoubleConfirmation: true,
        error: null,
      };
    }

    return {
      remainingAfter: 0,
      bust: false,
      checkout: true,
      needsDoubleConfirmation: false,
      error: null,
    };
  }

  return {
    remainingAfter: nextRemaining,
    bust: false,
    checkout: false,
    needsDoubleConfirmation: false,
    error: null,
  };
}