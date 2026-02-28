/**
 * Hint solver (fast):
 * Finds a valid placement that keeps the puzzle solvable.
 * Uses bitmask + memoization + time budget to avoid freezing the UI.
 */

import type { Piece } from "./levelGenerator";

export type HintPlacement = {
  pieceId: string;
  topLeft: { r: number; c: number };
};

type PrePlacement = {
  r: number;
  c: number;
  mask: bigint;
};

type PrePiece = {
  pieceId: string;
  area: number;
  placements: PrePlacement[];
};

type CellRC = { r: number; c: number } | [number, number];

function cellToRC(cell: unknown): { r: number; c: number } {
  if (Array.isArray(cell)) {
    const dr = (cell as any[])[0];
    const dc = (cell as any[])[1];
    if (!Number.isFinite(dr) || !Number.isFinite(dc)) {
      throw new Error(`hintSolver: invalid cell tuple ${JSON.stringify(cell)}`);
    }
    return { r: Math.trunc(dr), c: Math.trunc(dc) };
  }
  const obj = cell as any;
  if (!obj || !Number.isFinite(obj.r) || !Number.isFinite(obj.c)) {
    throw new Error(`hintSolver: invalid cell object ${JSON.stringify(cell)}`);
  }
  return { r: Math.trunc(obj.r), c: Math.trunc(obj.c) };
}

function rcToBit(r: number, c: number, size: number): bigint {
  // Coerce to integers (guards against floats)
  const rr = Math.trunc(r);
  const cc = Math.trunc(c);

  const idx = rr * size + cc;

  // Validate idx is a proper integer within the grid
  if (!Number.isFinite(idx) || !Number.isInteger(idx)) {
    throw new Error(`hintSolver: non-integer bit index (r=${r}, c=${c}, size=${size}, idx=${idx})`);
  }
  if (idx < 0 || idx >= size * size) {
    throw new Error(`hintSolver: out-of-bounds bit index (r=${r}, c=${c}, size=${size}, idx=${idx})`);
  }

  return 1n << BigInt(idx);
}

function gridToFilledMask(grid: number[][], size: number): bigint {
  let filled = 0n;
  for (let r = 0; r < size; r++) {
    const row = grid[r];
    for (let c = 0; c < size; c++) {
      if (row[c] !== 0) filled |= rcToBit(r, c, size);
    }
  }
  return filled;
}

function buildPrePieces(gridSize: number, remainingPieces: Piece[]): PrePiece[] {
  return remainingPieces.map((p) => {
    // 1) Normalize cells to a tight bounding box derived from the cells themselves
    const rawCells = p.cells as unknown as CellRC[];
    const rcCells = rawCells.map(cellToRC);

    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const { r, c } of rcCells) {
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    }

    // Normalize so min becomes 0
    const normCells = rcCells.map(({ r, c }) => ({ r: r - minR, c: c - minC }));
    const height = (maxR - minR) + 1;
    const width = (maxC - minC) + 1;

    // 2) Generate only anchors that can possibly fit based on computed bbox
    const placements: PrePlacement[] = [];
    const maxAnchorR = gridSize - height;
    const maxAnchorC = gridSize - width;

    // If bbox itself doesn't fit, no placements
    if (maxAnchorR < 0 || maxAnchorC < 0) {
      return { pieceId: p.pieceId, area: normCells.length, placements: [] };
    }

    for (let r = 0; r <= maxAnchorR; r++) {
      for (let c = 0; c <= maxAnchorC; c++) {
        let mask = 0n;
        let valid = true;

        for (const cell of normCells) {
          const rr = r + cell.r;
          const cc = c + cell.c;

          // Hard bounds guard (prevents out-of-bounds crashes even if data is weird)
          if (rr < 0 || rr >= gridSize || cc < 0 || cc >= gridSize) {
            valid = false;
            break;
          }

          mask |= rcToBit(rr, cc, gridSize);
        }

        if (valid) placements.push({ r, c, mask });
      }
    }

    return {
      pieceId: p.pieceId,
      area: normCells.length,
      placements,
    };
  });
}

/**
 * Time-sliced depth-first search with memoization.
 * Returns true if solvable.
 */
function createSolver(
  gridSize: number,
  filledStart: bigint,
  prePieces: PrePiece[],
  timeBudgetMs: number
) {
  const deadline = Date.now() + timeBudgetMs;

  // memo key: filledMask + "|" + remainingIds
  const memo = new Map<string, boolean>();

  const totalCells = gridSize * gridSize;
  const fullMask = (1n << BigInt(totalCells)) - 1n;

  // Precompute remaining area sum for fast empty-cell pruning
  const areaById = new Map<string, number>();
  for (const p of prePieces) areaById.set(p.pieceId, p.area);

  function remainingKey(ids: string[]): string {
    // ids are kept sorted for stable memo keys
    return ids.join(",");
  }

  function keyOf(filled: bigint, ids: string[]): string {
    return filled.toString() + "|" + remainingKey(ids);
  }

  function sumArea(ids: string[]): number {
    let s = 0;
    for (const id of ids) s += areaById.get(id) ?? 0;
    return s;
  }

  function placementsThatFit(piece: PrePiece, filled: bigint): PrePlacement[] {
    // Filter placements that do not overlap filled
    const out: PrePlacement[] = [];
    for (const pl of piece.placements) {
      if ((pl.mask & filled) === 0n) out.push(pl);
    }
    return out;
  }

  function getPieceById(id: string): PrePiece | undefined {
    return prePieces.find((p) => p.pieceId === id);
  }

  function pickMostConstrained(ids: string[], filled: bigint): { id: string; fits: PrePlacement[] } | null {
    let bestId: string | null = null;
    let bestFits: PrePlacement[] = [];
    let bestCount = Infinity;

    for (const id of ids) {
      const piece = getPieceById(id);
      if (!piece) continue;
      const fits = placementsThatFit(piece, filled);
      const count = fits.length;
      if (count === 0) return { id, fits }; // immediate dead end
      if (count < bestCount) {
        bestCount = count;
        bestId = id;
        bestFits = fits;
        if (bestCount === 1) break;
      }
    }
    if (!bestId) return null;
    return { id: bestId, fits: bestFits };
  }

  function dfs(filled: bigint, remainingIds: string[]): boolean {
    // Time budget guard (prevents freezing)
    if (Date.now() > deadline) return false;

    // If no pieces left, solved if full
    if (remainingIds.length === 0) return filled === fullMask;

    // Quick prune: remaining area must equal empty cells
    const empty = totalCells - Number(popcountBigInt(filled));
    const remArea = sumArea(remainingIds);
    if (remArea !== empty) return false;

    const k = keyOf(filled, remainingIds);
    const cached = memo.get(k);
    if (cached != null) return cached;

    // Choose most constrained piece first (MRV heuristic)
    const pick = pickMostConstrained(remainingIds, filled);
    if (!pick) {
      memo.set(k, false);
      return false;
    }

    // If chosen piece has no fits -> dead end
    if (pick.fits.length === 0) {
      memo.set(k, false);
      return false;
    }

    const nextRemaining = remainingIds.filter((x) => x !== pick.id);

    for (const pl of pick.fits) {
      const filled2 = filled | pl.mask;
      if (dfs(filled2, nextRemaining)) {
        memo.set(k, true);
        return true;
      }
    }

    memo.set(k, false);
    return false;
  }

  // helper to count bits (popcount)
  function popcountBigInt(x: bigint): bigint {
    let v = x;
    let count = 0n;
    while (v) {
      v &= v - 1n;
      count++;
    }
    return count;
  }

  function isSolvableFrom(filled: bigint, remainingIds: string[]): boolean {
    // remainingIds should be sorted for stable memo keys
    const ids = [...remainingIds].sort();
    return dfs(filled, ids);
  }

  return { isSolvableFrom };
}

/**
 * Async API: yields to UI between chunks.
 * Returns a placement guaranteed to keep solvability, or null if none found (or time budget exceeded).
 */
export async function findFirstValidPlacementAsync(
  gridSize: number,
  grid: number[][],
  remainingPieces: Piece[],
  options?: { timeBudgetMs?: number; yieldEveryMs?: number }
): Promise<HintPlacement | null> {
  if (remainingPieces.length === 0) return null;

  const timeBudgetMs = options?.timeBudgetMs ?? 10;     // per attempt
  const yieldEveryMs = options?.yieldEveryMs ?? 8;      // UI-friendly yielding

  const filledStart = gridToFilledMask(grid, gridSize);
  const prePieces = buildPrePieces(gridSize, remainingPieces);

  const remainingIds = prePieces.map((p) => p.pieceId).sort();

  // Try each piece/placement as the suggested move; verify solvable with time-bounded solver.
  let lastYield = Date.now();

  for (const p of prePieces) {
    // placements that fit current filled
    for (const pl of p.placements) {
      if ((pl.mask & filledStart) !== 0n) continue;

      // yield to UI periodically
      const now = Date.now();
      if (now - lastYield >= yieldEveryMs) {
        await new Promise<void>((res) => requestAnimationFrame(() => res()));
        lastYield = Date.now();
      }

      // Build solver with a fresh deadline per candidate (keeps UI responsive)
      const solver = createSolver(gridSize, filledStart | pl.mask, prePieces.filter(x => x.pieceId !== p.pieceId), timeBudgetMs);

      const nextIds = remainingIds.filter((id) => id !== p.pieceId);
      const solvable = solver.isSolvableFrom(filledStart | pl.mask, nextIds);
      if (solvable) {
        return { pieceId: p.pieceId, topLeft: { r: pl.r, c: pl.c } };
      }
    }
  }

  return null;
}