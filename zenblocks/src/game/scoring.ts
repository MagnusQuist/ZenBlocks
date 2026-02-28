/**
 * Level-completion scoring: base score, clean and streak multipliers.
 * Score is awarded per completed level only.
 */

export type ScoreBreakdown = {
  baseScore: number;
  cleanMultiplier: number;
  streakMultiplier: number;
  finalLevelScore: number;
};

/**
 * BaseScore = (gridWidth * gridHeight) * 10
 */
export function getBaseScore(gridWidth: number, gridHeight: number): number {
  return gridWidth * gridHeight * 10;
}

/**
 * Clean solve: no undo and no restart this level. Multiplier 1.25, else 1.0.
 */
export function getCleanMultiplier(usedUndoThisLevel: boolean, restartedThisLevel: boolean): number {
  return !usedUndoThisLevel && !restartedThisLevel ? 1.25 : 1.0;
}

/**
 * When streakActive (streak >= 2): min(2.5, 1.0 + streakCount * 0.1). Else 1.0.
 */
export function getStreakMultiplier(streakActive: boolean, streakCount: number): number {
  if (!streakActive) return 1.0;
  return Math.min(2.5, 1.0 + streakCount * 0.1);
}

/**
 * FinalLevelScore = round(BaseScore * CleanMultiplier * StreakMultiplier)
 */
export function computeLevelScore(
  gridWidth: number,
  gridHeight: number,
  usedUndoThisLevel: boolean,
  restartedThisLevel: boolean,
  streakActive: boolean,
  streakCount: number
): ScoreBreakdown {
  const baseScore = getBaseScore(gridWidth, gridHeight);
  const cleanMultiplier = getCleanMultiplier(usedUndoThisLevel, restartedThisLevel);
  const streakMultiplier = getStreakMultiplier(streakActive, streakCount);
  const finalLevelScore = Math.round(baseScore * cleanMultiplier * streakMultiplier);
  return {
    baseScore,
    cleanMultiplier,
    streakMultiplier,
    finalLevelScore,
  };
}
