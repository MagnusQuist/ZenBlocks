/**
 * Title unlock milestones: static ordered list driven by totalScore.
 * Unlocked/locked derived from score; selected title persisted separately.
 */

export type TitleMilestoneId =
  | "title_block_beginner"
  | "title_shape_solver"
  | "title_grid_tamer"
  | "title_flow_keeper"
  | "title_neon_architect"
  | "title_pattern_master"
  | "title_puzzle_virtuoso"
  | "title_spatial_sage"
  | "title_block_enlightened";

export type TitleMilestone = {
  id: TitleMilestoneId;
  name: string;
  requiredScore: number;
  /** Multiplier applied to level score when this title is selected (e.g. 1.05 = +5%). */
  scoreMultiplier: number;
  /** Extra free hints per level (added to the 1 base). */
  extraHint?: number;
  /** Extra undos per level (added to the 1 base). */
  extraUndo?: number;
  description?: string;
};

/** Ordered list of title unlock milestones (exact order and thresholds as specified). */
export const TITLE_MILESTONES: readonly TitleMilestone[] = [
  { id: "title_block_beginner", name: "Block Beginner", requiredScore: 2000, scoreMultiplier: 1.05 },
  { id: "title_shape_solver", name: "Shape Solver", requiredScore: 5000, scoreMultiplier: 1.1 },
  { id: "title_grid_tamer", name: "Grid Tamer", requiredScore: 12000, scoreMultiplier: 1.15, extraHint: 1 },
  { id: "title_flow_keeper", name: "Flow Keeper", requiredScore: 25000, scoreMultiplier: 1.2 },
  { id: "title_neon_architect", name: "Neon Architect", requiredScore: 50000, scoreMultiplier: 1.25, extraUndo: 1 },
  { id: "title_pattern_master", name: "Pattern Master", requiredScore: 90000, scoreMultiplier: 1.3 },
  { id: "title_puzzle_virtuoso", name: "Puzzle Virtuoso", requiredScore: 150000, scoreMultiplier: 1.35, extraHint: 1, extraUndo: 1 },
  { id: "title_spatial_sage", name: "Spatial Sage", requiredScore: 250000, scoreMultiplier: 1.4 },
  { id: "title_block_enlightened", name: "Block Enlightened", requiredScore: 400000, scoreMultiplier: 1.45 },
];

const FIRST_UNLOCK_SCORE = TITLE_MILESTONES[0].requiredScore;

/** Default title id when none unlocked yet (only valid after first unlock). */
export const DEFAULT_TITLE_ID: TitleMilestoneId = "title_block_beginner";

/** Score required to unlock the first title. */
export function getFirstUnlockScore(): number {
  return FIRST_UNLOCK_SCORE;
}

/** All title ids that are unlocked at the given totalScore. */
export function getUnlockedTitleIds(totalScore: number): TitleMilestoneId[] {
  return TITLE_MILESTONES.filter((t) => totalScore >= t.requiredScore).map((t) => t.id);
}

/** Highest unlocked title id by score, or null if none. */
export function getHighestUnlockedTitleId(totalScore: number): TitleMilestoneId | null {
  for (let i = TITLE_MILESTONES.length - 1; i >= 0; i--) {
    if (totalScore >= TITLE_MILESTONES[i].requiredScore) return TITLE_MILESTONES[i].id;
  }
  return null;
}

/** Get milestone by id. */
export function getTitleById(id: TitleMilestoneId | null): TitleMilestone | null {
  if (!id) return null;
  return TITLE_MILESTONES.find((t) => t.id === id) ?? null;
}

/** Whether the given title id is unlocked at totalScore. */
export function isTitleUnlocked(totalScore: number, titleId: TitleMilestoneId): boolean {
  const m = getTitleById(titleId);
  return m != null && totalScore >= m.requiredScore;
}

/** Score multiplier for the given title (1.0 if null or not found). */
export function getTitleScoreMultiplier(id: TitleMilestoneId | null): number {
  const m = getTitleById(id);
  return m?.scoreMultiplier ?? 1.0;
}
