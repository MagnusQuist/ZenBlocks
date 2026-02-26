/**
 * Placement record for undo and validity checks.
 */

import { getAbsoluteOccupied } from "./gridUtils";

export type Placement = {
  pieceId: string;
  topLeft: { r: number; c: number };
  occupied: Array<{ r: number; c: number }>;
};

export function createPlacement(
  pieceId: string,
  topLeft: { r: number; c: number },
  pieceCells: number[][]
): Placement {
  const occupied = getAbsoluteOccupied(pieceCells, topLeft);
  return { pieceId, topLeft, occupied };
}
