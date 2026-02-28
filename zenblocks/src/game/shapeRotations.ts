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

function trimMatrix(m: number[][]): number[][] {
  let top = 0, bottom = m.length - 1;
  let left = 0, right = (m[0]?.length ?? 0) - 1;

  const rowHasOne = (r: number) => m[r].some(v => v === 1);
  const colHasOne = (c: number) => m.some(row => row[c] === 1);

  while (top <= bottom && !rowHasOne(top)) top++;
  while (bottom >= top && !rowHasOne(bottom)) bottom--;
  while (left <= right && !colHasOne(left)) left++;
  while (right >= left && !colHasOne(right)) right--;

  const out: number[][] = [];
  for (let r = top; r <= bottom; r++) {
    out.push(m[r].slice(left, right + 1));
  }

  return out.length ? out : [[1]];
}

/** All four rotations of a matrix (0°, 90°, 180°, 270°) */
export function allRotations(cells: number[][]): number[][][] {
  const seen = new Set<string>();
  const result: number[][][] = [];

  let current = trimMatrix(cells);

  for (let i = 0; i < 4; i++) {
    const key = JSON.stringify(current);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(current);
    }
    current = trimMatrix(rotate90(current));
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
