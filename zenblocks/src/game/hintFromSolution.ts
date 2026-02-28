/**
 * Hint from stored solution: no backtracking, no grid copy.
 * Returns the first solution step that still fits the current grid and remaining pieces.
 */

import type { Piece } from "./levelGenerator";
import type { SolutionPlacement } from "./solution";

export type HintPlacement = {
  pieceId: string;
  topLeft: { r: number; c: number };
};

/**
 * Get absolute occupied cells from solution placement.
 * cells is number[][] (1 = filled); we iterate and convert to absolute positions.
 */
function getOccupiedFromPlacement(
  placement: SolutionPlacement,
  gridSize: number
): { r: number; c: number }[] | null {
  const { topLeft, cells } = placement;
  const out: { r: number; c: number }[] = [];
  const rows = Array.isArray(cells) ? cells : [];
  for (let dr = 0; dr < rows.length; dr++) {
    const row = rows[dr];
    if (!Array.isArray(row)) continue;
    for (let dc = 0; dc < row.length; dc++) {
      if (row[dc] !== 0 && row[dc] !== undefined) {
        const r = topLeft.r + dr;
        const c = topLeft.c + dc;
        if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return null;
        out.push({ r, c });
      }
    }
  }
  return out;
}

/**
 * Find the first solution step that (1) pieceId is still in remainingPieces,
 * (2) all placement cells land on empty grid cells (value 0).
 * No recursion, no grid copy. Returns null if player has deviated and no step fits.
 */
export function findHintFromStoredSolution(
  gridSize: number,
  grid: number[][],
  remainingPieces: Piece[],
  solution: SolutionPlacement[]
): HintPlacement | null {
  const remainingIds = new Set(remainingPieces.map((p) => p.pieceId));

  for (let i = 0; i < solution.length; i++) {
    const step = solution[i];
    if (!remainingIds.has(step.pieceId)) continue;

    const occupied = getOccupiedFromPlacement(step, gridSize);
    if (!occupied || occupied.length === 0) continue;

    let allEmpty = true;
    for (const { r, c } of occupied) {
      if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) {
        allEmpty = false;
        break;
      }
      if (grid[r][c] !== 0) {
        allEmpty = false;
        break;
      }
    }
    if (!allEmpty) continue;

    return { pieceId: step.pieceId, topLeft: step.topLeft };
  }

  return null;
}
