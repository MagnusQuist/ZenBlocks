/**
 * Grid coordinate and occupancy helpers.
 * Grid is 0-indexed; cell (r, c) = row r, column c.
 */

export function createEmptyGrid(size: number): number[][] {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

/** Get list of (r, c) where cells[r][c] === 1, relative to top-left (0,0) */
export function getOccupiedCells(cells: number[][]): { r: number; c: number }[] {
  const out: { r: number; c: number }[] = [];
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < (cells[r]?.length ?? 0); c++) {
      if (cells[r][c] === 1) out.push({ r, c });
    }
  }
  return out;
}

/** Absolute cell positions for a piece with topLeft anchor */
export function getAbsoluteOccupied(
  pieceCells: number[][],
  topLeft: { r: number; c: number }
): { r: number; c: number }[] {
  return getOccupiedCells(pieceCells).map(({ r, c }) => ({
    r: topLeft.r + r,
    c: topLeft.c + c,
  }));
}

/** Check if all positions are within [0, gridSize) and no overlap with grid (grid 0 = empty) */
export function isValidPlacement(
  gridSize: number,
  grid: number[][],
  occupied: { r: number; c: number }[]
): boolean {
  for (const { r, c } of occupied) {
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return false;
    if (grid[r][c] !== 0) return false;
  }
  return true;
}

/** Apply placement: set grid cells to 1 (or piece index) for occupied cells */
export function applyPlacement(
  grid: number[][],
  occupied: { r: number; c: number }[],
  value: number = 1
): void {
  for (const { r, c } of occupied) {
    grid[r][c] = value;
  }
}

/** Remove placement: set grid cells back to 0 */
export function clearPlacement(
  grid: number[][],
  occupied: { r: number; c: number }[]
): void {
  applyPlacement(grid, occupied, 0);
}
