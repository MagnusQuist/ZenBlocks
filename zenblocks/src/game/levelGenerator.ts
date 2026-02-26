/**
 * Solvable level generation by tiling: fill grid with pieces, then shuffle for tray.
 */

import type { Shape } from "./shapes";
import { allRotations } from "./shapeRotations";
import {
  createEmptyGrid,
  getOccupiedCells,
  getAbsoluteOccupied,
  isValidPlacement,
  applyPlacement,
  clearPlacement,
} from "./gridUtils";
import {
  getGridSizeForLevel,
  getTiersForLevel,
  getShapesForTier,
  type Tier,
} from "./difficultyCurve";

export type Piece = {
  pieceId: string;
  shapeId: string;
  cells: number[][];
  width: number;
  height: number;
  colorKey: string;
};

const COLOR_KEYS = [
  "coral",
  "mint",
  "sky",
  "lavender",
  "peach",
  "sage",
  "rose",
  "sand",
];

let pieceIdCounter = 0;
function nextPieceId(): string {
  return `p_${++pieceIdCounter}`;
}

/** Top-left first empty cell, or null if grid full */
function findFirstEmpty(grid: number[][], size: number): { r: number; c: number } | null {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) return { r, c };
    }
  }
  return null;
}

/** Try to place one shape at (r, c); returns occupied cells if valid, else null */
function tryPlace(
  grid: number[][],
  size: number,
  cells: number[][],
  anchor: { r: number; c: number }
): { r: number; c: number }[] | null {
  const occupied = getAbsoluteOccupied(cells, anchor);
  if (!isValidPlacement(size, grid, occupied)) return null;
  return occupied;
}

const MAX_BACKTRACK = 500;

/** Tiling fill: place shapes until grid is full. Prefers larger pieces (fewer total), then variety as tiebreaker. */
function tilingFill(
  grid: number[][],
  size: number,
  candidateShapes: Shape[]
): Array<{ shape: Shape; cells: number[][]; occupied: { r: number; c: number }[] }> | null {
  const placed: Array<{
    shape: Shape;
    cells: number[][];
    occupied: { r: number; c: number }[];
  }> = [];
  const usageByShapeId = new Map<string, number>();
  let backtrackCount = 0;

  function getCandidatesOrdered(): Shape[] {
    return [...candidateShapes].sort((a, b) => {
      if (a.unitCount !== b.unitCount) return b.unitCount - a.unitCount;
      const useA = usageByShapeId.get(a.id) ?? 0;
      const useB = usageByShapeId.get(b.id) ?? 0;
      return useA - useB;
    });
  }

  while (backtrackCount < MAX_BACKTRACK) {
    const anchor = findFirstEmpty(grid, size);
    if (!anchor) return placed;

    let placedOne = false;
    for (const shape of getCandidatesOrdered()) {
      const rotations = allRotations(shape.cells);
      const shuffledRotations = [...rotations].sort(() => Math.random() - 0.5);
      for (const cells of shuffledRotations) {
        const occupied = tryPlace(grid, size, cells, anchor);
        if (occupied) {
          applyPlacement(grid, occupied, 1);
          placed.push({ shape, cells, occupied });
          usageByShapeId.set(shape.id, (usageByShapeId.get(shape.id) ?? 0) + 1);
          placedOne = true;
          break;
        }
      }
      if (placedOne) break;
    }

    if (!placedOne) {
      if (placed.length === 0) return null;
      const last = placed.pop()!;
      const count = usageByShapeId.get(last.shape.id) ?? 0;
      if (count <= 1) usageByShapeId.delete(last.shape.id);
      else usageByShapeId.set(last.shape.id, count - 1);
      clearPlacement(grid, last.occupied);
      backtrackCount++;
    } else {
      backtrackCount = 0;
    }
  }
  return null;
}

/** Fisher–Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Build Piece[] from tiling result with color keys */
function toPieces(
  placed: Array<{ shape: Shape; cells: number[][]; occupied: { r: number; c: number }[] }>
): Piece[] {
  return placed.map(({ shape, cells }, i) => {
    const rows = cells.length;
    const cols = cells[0]?.length ?? 0;
    return {
      pieceId: nextPieceId(),
      shapeId: shape.id,
      cells,
      width: cols,
      height: rows,
      colorKey: COLOR_KEYS[i % COLOR_KEYS.length],
    };
  });
}

/** Generate a solvable level for the given level number */
export function generateLevel(levelNumber: number): {
  gridSize: number;
  grid: number[][];
  pieces: Piece[];
} {
  pieceIdCounter = 0;
  const gridSize = getGridSizeForLevel(levelNumber);
  const tiers = getTiersForLevel(levelNumber);
  const tier = tiers[tiers.length - 1] ?? 1;
  const candidateShapes = [...getShapesForTier(tier)].sort(
    (a, b) => b.unitCount - a.unitCount
  );

  for (let attempt = 0; attempt < 50; attempt++) {
    const grid = createEmptyGrid(gridSize);
    const placed = tilingFill(grid, gridSize, candidateShapes);
    if (placed && placed.length > 0) {
      const pieces = shuffle(toPieces(placed));
      const emptyGrid = createEmptyGrid(gridSize);
      return { gridSize, grid: emptyGrid, pieces };
    }
  }

  // Fallback: minimal level
  const grid = createEmptyGrid(4);
  const fallbackShapes = getShapesForTier(1);
  const placed = tilingFill(grid, 4, fallbackShapes);
  const pieces = placed ? shuffle(toPieces(placed)) : [];
  return { gridSize: 4, grid: createEmptyGrid(4), pieces };
}
