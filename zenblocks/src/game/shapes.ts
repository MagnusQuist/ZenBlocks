/**
 * Shape definitions as integer matrices (1 = filled, 0 = empty).
 * Tier 1–3 polyominoes, 1–5 blocks. One canonical orientation per shape.
 */

export type Shape = {
  id: string;
  cells: number[][];
  unitCount: number;
};

function countUnits(cells: number[][]): number {
  return cells.reduce((sum, row) => sum + row.reduce((s, c) => s + c, 0), 0);
}

function shape(id: string, cells: number[][]): Shape {
  return { id, cells, unitCount: countUnits(cells) };
}

/** Tier 1: single, domino, 3-line, small L */
export const TIER_1_SHAPES: Shape[] = [
  shape("single", [[1]]),
  shape("domino", [[1, 1]]),
  shape("3-line", [[1, 1, 1]]),
  shape("small-l", [[1, 0], [1, 1]]),
];

/** Tier 2: tetrominoes — O, I, L, T, Z */
export const TIER_2_SHAPES: Shape[] = [
  shape("o", [[1, 1], [1, 1]]),
  shape("i", [[1, 1, 1, 1]]),
  shape("l", [[1, 0, 0], [1, 0, 0], [1, 1, 0]]),
  shape("t", [[1, 1, 1], [0, 1, 0]]),
  shape("z", [[1, 1, 0], [0, 1, 1]]),
];

/** Tier 3: pentominoes — 5-line, long L, extended T, plus, step */
export const TIER_3_SHAPES: Shape[] = [
  shape("5-line", [[1, 1, 1, 1, 1]]),
  shape("long-l", [[1, 0, 0], [1, 0, 0], [1, 1, 1]]),
  shape("extended-t", [[1, 1, 1], [0, 1, 0], [0, 1, 0]]),
  shape("plus", [[0, 1, 0], [1, 1, 1], [0, 1, 0]]),
  shape("step", [[1, 1, 0], [0, 1, 1], [0, 0, 1]]),
];

export const ALL_SHAPES: Shape[] = [
  ...TIER_1_SHAPES,
  ...TIER_2_SHAPES,
  ...TIER_3_SHAPES,
];

export const SHAPES_BY_ID: Record<string, Shape> = Object.fromEntries(
  ALL_SHAPES.map((s) => [s.id, s])
);
