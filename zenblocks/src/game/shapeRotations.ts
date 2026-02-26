/**
 * Precomputed rotated variants for level generator use.
 * Player cannot rotate; generator picks one orientation per piece.
 */

import type { Shape } from "./shapes";

/** Rotate matrix 90° clockwise */
function rotate90(cells: number[][]): number[][] {
  const rows = cells.length;
  const cols = cells[0]?.length ?? 0;
  const out: number[][] = [];
  for (let c = 0; c < cols; c++) {
    const row: number[] = [];
    for (let r = rows - 1; r >= 0; r--) row.push(cells[r][c]);
    out.push(row);
  }
  return out;
}

/** All four rotations of a matrix (0°, 90°, 180°, 270°) */
export function allRotations(cells: number[][]): number[][][] {
  const result: number[][][] = [cells];
  let current = cells;
  for (let i = 0; i < 3; i++) {
    current = rotate90(current);
    result.push(current.map((row) => [...row]));
  }
  return result;
}

/** Return a single shape with one of its rotated cell matrices (for generator) */
export function shapeWithOrientation(shape: Shape, cells: number[][]): Shape {
  const unitCount = cells.reduce(
    (sum, row) => sum + row.reduce((s, c) => s + c, 0),
    0
  );
  return { id: shape.id, cells, unitCount };
}
