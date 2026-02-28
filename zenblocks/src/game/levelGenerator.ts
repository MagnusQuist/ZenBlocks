/**
 * Solvable level generation by tiling: fill grid with pieces, then shuffle for tray.
 * Returns solution (ordered placements) for hint-from-stored-solution.
 */

import type { Shape } from "./shapes";
import { allRotations } from "./shapeRotations";
import {
  createEmptyGrid,
  getAbsoluteOccupied,
  isValidPlacement,
  applyPlacement,
  clearPlacement,
} from "./gridUtils";

import { getGridSizeForLevel, getGeneratorConfig } from "./difficultyCurve";
import { SHAPES_BY_ID, TIER_1_SHAPES } from "./shapes";
import type { SolutionPlacement } from "./solution";

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

function buildWeightedCandidates(weights: Record<string, number>): Shape[] {
  const out: Shape[] = [];
  for (const [shapeId, w] of Object.entries(weights)) {
    const shape = SHAPES_BY_ID[shapeId];
    if (!shape) continue;
    for (let i = 0; i < w; i++) out.push(shape);
  }
  return out;
}

function filterByGridSize(shape: Shape, gridSize: number): boolean {
  const h = shape.cells.length;
  const w = shape.cells[0]?.length ?? 0;
  return h <= gridSize && w <= gridSize;
}

function countSingles(
  placed: Array<{ shape: Shape; cells: number[][]; occupied: { r: number; c: number }[] }>
): number {
  return placed.reduce((acc, p) => acc + (p.shape.unitCount === 1 ? 1 : 0), 0);
}

function countByShapeId(
  placed: Array<{ shape: Shape; cells: number[][]; occupied: { r: number; c: number }[] }>
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of placed) out[p.shape.id] = (out[p.shape.id] ?? 0) + 1;
  return out;
}

function countIrregular(byId: Record<string, number>): number {
  const IRREGULAR = ["t", "z", "step", "plus", "extended-t", "long-l"];
  return IRREGULAR.reduce((sum, id) => sum + (byId[id] ?? 0), 0);
}

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
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

/** Try to place one shape at anchor; returns occupied cells if valid, else null */
function tryPlace(
  grid: number[][],
  size: number,
  cells: number[][],
  anchor: { r: number; c: number }
): { r: number; c: number }[] | null {
  const occupied = getAbsoluteOccupied(cells, anchor);

  // Ensure we actually fill the first empty cell, otherwise cavities happen.
  if (!occupied.some((p) => p.r === anchor.r && p.c === anchor.c)) return null;

  if (!isValidPlacement(size, grid, occupied)) return null;
  return occupied;
}

const MAX_BACKTRACK = 250;

/** Tiling fill: place shapes until grid is full (time-boxed). */
function tilingFill(
  grid: number[][],
  size: number,
  candidateShapes: Shape[],
  deadlineMs: number
): Array<{ shape: Shape; cells: number[][]; occupied: { r: number; c: number }[] }> | null {
  const placed: Array<{
    shape: Shape;
    cells: number[][];
    occupied: { r: number; c: number }[];
  }> = [];

  const usageByShapeId = new Map<string, number>();
  let backtrackCount = 0;

  let steps = 0;
  const MAX_STEPS = size * size * 200;

  while (backtrackCount < MAX_BACKTRACK) {
    if (nowMs() > deadlineMs) return null;
    if (++steps > MAX_STEPS) return null;

    const anchor = findFirstEmpty(grid, size);
    if (!anchor) return placed;

    let placedOne = false;
    const SHAPE_TRIES_PER_STEP = 18;

    for (let t = 0; t < SHAPE_TRIES_PER_STEP; t++) {
      const shape = candidateShapes[Math.floor(Math.random() * candidateShapes.length)];
      const used = usageByShapeId.get(shape.id) ?? 0;

      // Light variety control
      if (used >= 6 && Math.random() < 0.6) continue;

      const rotations = allRotations(shape.cells);
      const shuffledRotations = [...rotations].sort(() => Math.random() - 0.5);

      for (const cells of shuffledRotations) {
        const occupied = tryPlace(grid, size, cells, anchor);
        if (!occupied) continue;

        applyPlacement(grid, occupied, 1);
        placed.push({ shape, cells, occupied });
        usageByShapeId.set(shape.id, used + 1);
        placedOne = true;
        break;
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

/** Build Piece[] from tiling result with color keys (same order as placed). */
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

/** Build solution from placed (tiling order) and pieces (same index order). */
function toSolution(
  placed: Array<{ shape: Shape; cells: number[][]; occupied: { r: number; c: number }[] }>,
  pieces: Piece[]
): SolutionPlacement[] {
  if (placed.length !== pieces.length) return [];
  return placed.map((pl, i) => {
    const topLeft = {
      r: Math.min(...pl.occupied.map((o) => o.r)),
      c: Math.min(...pl.occupied.map((o) => o.c)),
    };
    return {
      pieceId: pieces[i].pieceId,
      topLeft,
      cells: pl.cells,
    };
  });
}

/** Generate a solvable level for the given level number */
export function generateLevel(levelNumber: number): {
  gridSize: number;
  grid: number[][];
  pieces: Piece[];
  solution: SolutionPlacement[];
} {
  pieceIdCounter = 0;

  const gridSize = getGridSizeForLevel(levelNumber);
  const cfg = getGeneratorConfig(levelNumber);

  const candidateShapes = buildWeightedCandidates(cfg.weights)
    .filter((s) => filterByGridSize(s, gridSize));

  const emptySolution: SolutionPlacement[] = [];

  // Safety: if something went wrong with weights/shape IDs
  if (candidateShapes.length === 0) {
    const fallbackGrid = createEmptyGrid(4);
    const placed = tilingFill(fallbackGrid, 4, [...TIER_1_SHAPES], nowMs() + 30);
    const piecesOrdered = placed ? toPieces(placed) : [];
    const solution = placed ? toSolution(placed, piecesOrdered) : emptySolution;
    const pieces = shuffle(piecesOrdered);
    return { gridSize: 4, grid: createEmptyGrid(4), pieces, solution };
  }

  // Prevent UI freezes: time-box generation and progressively relax constraints.
  const start = nowMs();
  const TIME_BUDGET_MS = 80;
  const deadlineMsBase = start + TIME_BUDGET_MS;

  const phases = [
    { piecesFactorBoost: 0.0, irregularBoost: 0, dominoBoost: 0, singlesBoost: 0 },
    { piecesFactorBoost: 0.04, irregularBoost: 1, dominoBoost: 1, singlesBoost: 0 },
    { piecesFactorBoost: 0.08, irregularBoost: 2, dominoBoost: 2, singlesBoost: 1 },
  ];

  for (const phase of phases) {
    for (let attempt = 0; attempt < 80; attempt++) {
      if (nowMs() > deadlineMsBase) break;

      // cap each attempt so a single tilingFill can't hang
      const deadlineMs = Math.min(deadlineMsBase, nowMs() + 20);

      const grid = createEmptyGrid(gridSize);
      const placed = tilingFill(grid, gridSize, candidateShapes, deadlineMs);
      if (!placed || placed.length === 0) continue;

      const byId = countByShapeId(placed);
      const singles = countSingles(placed);
      const irregular = countIrregular(byId);
      const dominoCount = byId["domino"] ?? 0;

      const hasRequired =
        cfg.requireOneOf.length === 0 ||
        cfg.requireOneOf.some((id) => (byId[id] ?? 0) > 0);

      const maxPieces = Math.ceil(
        gridSize * gridSize * (cfg.maxPiecesFactor + phase.piecesFactorBoost)
      );
      const maxSingles = cfg.maxSingles + phase.singlesBoost;
      const maxIrregular = cfg.maxIrregular + phase.irregularBoost;
      const maxDomino = cfg.maxDomino + phase.dominoBoost;

      if (!hasRequired) continue;
      if (singles > maxSingles) continue;
      if (placed.length > maxPieces) continue;
      if (irregular > maxIrregular) continue;
      if (dominoCount > maxDomino) continue;

      const piecesOrdered = toPieces(placed);
      const solution = toSolution(placed, piecesOrdered);
      const pieces = shuffle(piecesOrdered);
      return { gridSize, grid: createEmptyGrid(gridSize), pieces, solution };
    }
  }

  // Fallback: generate a simple 4x4 Tier-1 level quickly (never freeze)
  const fallbackGrid = createEmptyGrid(4);
  const fallbackCandidates = [...TIER_1_SHAPES];
  const fallbackPlaced = tilingFill(fallbackGrid, 4, fallbackCandidates, nowMs() + 40);
  const fallbackPiecesOrdered = fallbackPlaced ? toPieces(fallbackPlaced) : [];
  const fallbackSolution = fallbackPlaced ? toSolution(fallbackPlaced, fallbackPiecesOrdered) : emptySolution;
  const pieces = shuffle(fallbackPiecesOrdered);
  return { gridSize: 4, grid: createEmptyGrid(4), pieces, solution: fallbackSolution };
}