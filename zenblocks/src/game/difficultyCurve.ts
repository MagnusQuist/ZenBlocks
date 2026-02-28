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

export type GeneratorConfig = {
  /** Weight per shape id; higher = used more often */
  weights: Record<string, number>;
  /** Maximum pieces allowed as ceil(area * factor) */
  maxPiecesFactor: number;
  /** Maximum number of 1x1 pieces allowed */
  maxSingles: number;

  /** Soft caps to keep early levels from spiking in difficulty */
  maxIrregular: number; // T/Z/step/plus/extended-t/long-l
  maxDomino: number;

  /** Ensure early levels always have at least one "obvious anchor" */
  requireOneOf: string[]; // e.g. ["o","i"]
};

/** Linear interpolate helper */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Blend two weight maps smoothly */
function blendWeights(
  a: Record<string, number>,
  b: Record<string, number>,
  t: number
): Record<string, number> {
  const out: Record<string, number> = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  keys.forEach((k) => {
    out[k] = Math.max(0, Math.round(lerp(a[k] ?? 0, b[k] ?? 0, t)));
  });
  return out;
}

/**
 * Engagement-first curve:
 * - early levels feel easy and satisfying (big obvious pieces)
 * - variety stays high (multiple shape types appear)
 * - ramp is smooth via blending instead of step changes
 */
export function getGeneratorConfig(levelNumber: number): GeneratorConfig {
  // Base pools (weights)
  const EASY: Record<string, number> = {
    // Big easy chunks (early game)
    "2x3": 10,
    "3x2": 8,
    b: 5,
    "fat-l-7": 4,
    "3x3": 1, // rare

    // Classic friendly
    o: 8,
    i: 7,
    "3-line": 6,
    "small-l": 3,
    domino: 1,
    l: 1,
    t: 0,
    z: 0,
    single: 0,

    "5-line": 0,
    "long-l": 0,
    "extended-t": 0,
    plus: 0,
    step: 0,
  };

  const MED: Record<string, number> = {
    "2x3": 8,
    "3x2": 6,
    b: 4,
    "fat-l-7": 3,
    "3x3": 1, // still rare

    o: 7,
    i: 6,
    "3-line": 5,
    "small-l": 4,
    domino: 2,
    l: 3,
    t: 2,
    z: 2,
    single: 0,

    "5-line": 0,
    "long-l": 0,
    "extended-t": 0,
    plus: 0,
    step: 0,
  };

  const HARD: Record<string, number> = {
    // Chunks taper off but still appear occasionally
    "2x3": 4,
    "3x2": 3,
    b: 2,
    "fat-l-7": 1,
    "3x3": 0, // remove from late to avoid trivializing

    o: 5,
    i: 5,
    "3-line": 4,
    "small-l": 3,
    domino: 2,
    l: 4,
    t: 4,
    z: 4,
    single: 1,

    "5-line": 2,
    "long-l": 2,
    "extended-t": 2,
    plus: 1,
    step: 2,
  };

  // Smooth blending factors
  // 1..12 transitions EASY -> MED
  // 13..45 transitions MED -> HARD
  let weights: Record<string, number>;
  let maxPiecesFactor: number;
  let maxSingles: number;
  let maxIrregular: number;
  let maxDomino: number;
  let requireOneOf: string[];

  if (levelNumber <= 12) {
    const t = Math.max(0, Math.min(1, (levelNumber - 1) / 11));
    weights = blendWeights(EASY, MED, t);

    // Keep early levels snappy and easy
    maxPiecesFactor = lerp(0.30, 0.38, t); // fewer pieces early
    maxSingles = 0; // ✅ FIX: was missing
    maxIrregular = 1;
    maxDomino = 2;
    requireOneOf = ["2x3", "o", "i"]; // ensure a chunky or obvious anchor
  } else if (levelNumber <= 45) {
    const t = Math.max(0, Math.min(1, (levelNumber - 13) / 32));
    weights = blendWeights(MED, HARD, t);

    maxPiecesFactor = lerp(0.36, 0.46, t);
    maxSingles = t < 0.6 ? 0 : 1;
    maxIrregular = Math.round(lerp(2, 4, t));
    maxDomino = Math.round(lerp(3, 4, t));
    requireOneOf = ["2x3", "o", "i"];
  } else {
    weights = HARD;
    maxPiecesFactor = 0.54;
    maxSingles = 1;
    maxIrregular = 5;
    maxDomino = 5;
    requireOneOf = ["o", "i"];
  }

  // Add a small "rest level" pattern for engagement:
  // every 5th level becomes slightly easier (fewer pieces + more O/I)
  if (levelNumber % 5 === 0) {
    weights = {
      ...weights,
      o: (weights.o ?? 0) + 3,
      i: (weights.i ?? 0) + 2,
      t: Math.max(0, (weights.t ?? 0) - 1),
      z: Math.max(0, (weights.z ?? 0) - 1),
      step: Math.max(0, (weights.step ?? 0) - 1),
    };
    maxPiecesFactor = Math.max(0.32, maxPiecesFactor - 0.04);
    maxIrregular = Math.max(1, maxIrregular - 1);
  }

  return {
    weights,
    maxPiecesFactor,
    maxSingles,
    maxIrregular,
    maxDomino,
    requireOneOf,
  };
}