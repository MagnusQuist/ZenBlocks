/**
 * Stored solution: ordered placements from the level generator's tiling.
 * Used for hints without runtime backtracking.
 */

import type { Piece } from "./levelGenerator";

export type SolutionPlacement = {
  pieceId: string;
  topLeft: { r: number; c: number };
  /** Same format as Piece.cells (number[][]). */
  cells: Piece["cells"];
};
