/**
 * Difficulty curve: grid size and shape tiers by level number.
 * Levels 1–8: grid 4–5, mostly Tier 1
 * Levels 9–30: grid 5–6, add Tier 2
 * Levels 31–80: grid 6–7, more Tier 2
 * Levels 81+: grid 7–9, add Tier 3
 */

import { TIER_1_SHAPES, TIER_2_SHAPES, TIER_3_SHAPES } from "./shapes";
import type { Shape } from "./shapes";

export function getGridSizeForLevel(levelNumber: number): number {
  if (levelNumber <= 8) return levelNumber <= 3 ? 4 : 5;
  if (levelNumber <= 30) return 5 + (levelNumber % 2); // 5 or 6
  if (levelNumber <= 80) return 6 + (levelNumber % 2); // 6 or 7
  // 81+: 7–9 with occasional smaller "rest" levels
  const r = levelNumber % 10;
  if (r === 0 || r === 1) return 7;
  if (r <= 4) return 8;
  return 9;
}

export type Tier = 1 | 2 | 3;

/** Candidate shapes for level generation by tier */
export function getShapesForTier(tier: Tier): Shape[] {
  switch (tier) {
    case 1:
      return [...TIER_1_SHAPES];
    case 2:
      return [...TIER_1_SHAPES, ...TIER_2_SHAPES];
    case 3:
      return [...TIER_1_SHAPES, ...TIER_2_SHAPES, ...TIER_3_SHAPES];
    default:
      return TIER_1_SHAPES;
  }
}

/** Which tiers to use for a given level */
export function getTiersForLevel(levelNumber: number): Tier[] {
  if (levelNumber <= 8) return [1];
  if (levelNumber <= 30) return [1, 2];
  if (levelNumber <= 80) return [1, 2];
  return [1, 2, 3];
}
