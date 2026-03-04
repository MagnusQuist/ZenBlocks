/**
 * Difficulty curve: grid size and shape tiers by level number.
 * Levels 1–25: favor BIG pieces only (chunks + O/I), few pieces per level.
 * Levels 25+: slowly introduce smaller pieces and more pieces.
 * Grid: 1–8 → 4–5, 9–30 → 5–6, 31–80 → 6–7, 81+ → 7–9.
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
 * - Levels 1–25: big pieces only (chunks + O/I), low piece count
 * - Levels 25+: slowly introduce smaller pieces and more pieces
 */
export function getGeneratorConfig(levelNumber: number): GeneratorConfig {
  // Levels 1–25: BIG PIECES ONLY — chunks + O/I + light 3-line. No single/domino/small-l/l/t/z.
  const BIG_FIRST: Record<string, number> = {
    "2x3": 12,
    "3x2": 10,
    b: 6,
    "fat-l-7": 5,
    "3x3": 2,

    o: 8,
    i: 7,
    "3-line": 2, // minimal variety, still 3-block
    "small-l": 0,
    domino: 0,
    l: 0,
    t: 0,
    z: 0,
    single: 0,

    "5-line": 0,
    "long-l": 0,
    "extended-t": 0,
    plus: 0,
    step: 0,
  };

  // After 25: gradually add smaller and trickier shapes
  const MED: Record<string, number> = {
    "2x3": 8,
    "3x2": 6,
    b: 4,
    "fat-l-7": 3,
    "3x3": 1,

    o: 7,
    i: 6,
    "3-line": 5,
    "small-l": 3,
    domino: 1,
    l: 2,
    t: 1,
    z: 1,
    single: 0,

    "5-line": 0,
    "long-l": 0,
    "extended-t": 0,
    plus: 0,
    step: 0,
  };

  const HARD: Record<string, number> = {
    "2x3": 4,
    "3x2": 3,
    b: 2,
    "fat-l-7": 1,
    "3x3": 0,

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

  let weights: Record<string, number>;
  let maxPiecesFactor: number;
  let maxSingles: number;
  let maxIrregular: number;
  let maxDomino: number;
  let requireOneOf: string[];

  if (levelNumber <= 25) {
    // Strict big-pieces band: no blending yet, keep piece count low
    weights = { ...BIG_FIRST };
    // Fewer pieces = bigger average piece size. 0.20–0.26 over 1–25
    const t = Math.max(0, Math.min(1, (levelNumber - 1) / 24));
    maxPiecesFactor = lerp(0.20, 0.26, t);
    maxSingles = 0;
    maxIrregular = 0;
    maxDomino = 0;
    requireOneOf = ["2x3", "3x2", "o", "i"];
  } else if (levelNumber <= 55) {
    // Slow ramp: 25→55 blend MED → HARD, and slowly increase piece count
    const t = Math.max(0, Math.min(1, (levelNumber - 25) / 30));
    weights = blendWeights(MED, HARD, t);
    maxPiecesFactor = lerp(0.28, 0.42, t);
    maxSingles = t < 0.5 ? 0 : 1;
    maxIrregular = Math.round(lerp(1, 4, t));
    maxDomino = Math.round(lerp(1, 4, t));
    requireOneOf = ["2x3", "o", "i"];
  } else {
    weights = HARD;
    const t = Math.max(0, Math.min(1, (levelNumber - 55) / 45));
    maxPiecesFactor = lerp(0.42, 0.52, t);
    maxSingles = 1;
    maxIrregular = 5;
    maxDomino = 5;
    requireOneOf = ["o", "i"];
  }

  // Rest levels: slightly easier (more O/I, fewer pieces)
  if (levelNumber % 5 === 0) {
    weights = {
      ...weights,
      o: (weights.o ?? 0) + 3,
      i: (weights.i ?? 0) + 2,
      t: Math.max(0, (weights.t ?? 0) - 1),
      z: Math.max(0, (weights.z ?? 0) - 1),
      step: Math.max(0, (weights.step ?? 0) - 1),
    };
    maxPiecesFactor = Math.max(0.22, maxPiecesFactor - 0.04);
    maxIrregular = Math.max(0, maxIrregular - 1);
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