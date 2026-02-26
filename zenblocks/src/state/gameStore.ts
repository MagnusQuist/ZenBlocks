/**
 * Zustand game store: settings, progression, active level state.
 * Persists currentLevelNumber and settings to AsyncStorage.
 */

import { create } from "zustand";
import type { Piece } from "../game/levelGenerator";
import type { Placement } from "../game/placement";
import {
  getAbsoluteOccupied,
  isValidPlacement,
  applyPlacement,
  clearPlacement,
} from "../game/gridUtils";
import { createPlacement } from "../game/placement";
import { generateLevel } from "../game/levelGenerator";
import * as storage from "../services/storage";
import { MockAdsService } from "../services/ads";
import * as haptics from "../services/haptics";
import * as sound from "../services/sound";

export type LevelState = {
  levelNumber: number;
  gridSize: number;
  grid: number[][];
  remainingPieces: Piece[];
  placedPlacements: Placement[];
  placedPieces: Piece[]; // same order as placedPlacements, for undo restore
  undosRemaining: number;
};

/** Snapshot of level start: empty grid + all pieces, for retry (same pieces). */
export type InitialLevelSnapshot = {
  levelNumber: number;
  gridSize: number;
  grid: number[][];
  pieces: Piece[];
};

type Settings = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
};

type GameStore = {
  // state
  settings: Settings;
  currentLevelNumber: number;
  levelState: LevelState | null;
  initialLevelSnapshot: InitialLevelSnapshot | null;
  failureModalVisible: boolean;
  rewardedModalPurpose: "undo" | "skip" | null;
  interstitialVisible: boolean;
  pendingNextLevel: number | null;

  // actions
  initApp: () => Promise<void>;
  startNewLevel: (levelNumber: number) => void;
  placePiece: (pieceId: string, topLeft: { r: number; c: number }) => boolean;
  undo: () => void;
  retryLevel: () => void;
  checkFailure: () => boolean;
  completeLevel: () => void;
  skipLevelRewarded: () => void;
  setSoundEnabled: (v: boolean) => void;
  setHapticsEnabled: (v: boolean) => void;
  setFailureModalVisible: (v: boolean) => void;
  setRewardedModalPurpose: (p: "undo" | "skip" | null) => void;
  onRewardedComplete: () => void;
  onRewardedDismiss: () => void;
  dismissInterstitial: () => void;
};

function getPieceById(pieces: Piece[], pieceId: string): Piece | undefined {
  return pieces.find((p) => p.pieceId === pieceId);
}

export const useGameStore = create<GameStore>((set, get) => ({
  settings: { soundEnabled: true, hapticsEnabled: true },
  currentLevelNumber: 1,
  levelState: null,
  initialLevelSnapshot: null,
  failureModalVisible: false,
  rewardedModalPurpose: null,
  interstitialVisible: false,
  pendingNextLevel: null,

  initApp: async () => {
    const [level, settings] = await Promise.all([
      storage.getCurrentLevel(),
      storage.getSettings(),
    ]);
    set({
      currentLevelNumber: level,
      settings,
    });
    get().startNewLevel(level);
  },

  startNewLevel: (levelNumber: number) => {
    const { gridSize, grid, pieces } = generateLevel(levelNumber);
    const emptyGrid = grid.map((row) => [...row]);
    const snapshot: InitialLevelSnapshot = {
      levelNumber,
      gridSize,
      grid: emptyGrid.map((row) => [...row]),
      pieces,
    };
    set({
      currentLevelNumber: levelNumber,
      levelState: {
        levelNumber,
        gridSize,
        grid: emptyGrid,
        remainingPieces: pieces,
        placedPlacements: [],
        placedPieces: [],
        undosRemaining: 1,
      },
      initialLevelSnapshot: snapshot,
      failureModalVisible: false,
      rewardedModalPurpose: null,
    });
    storage.setCurrentLevel(levelNumber);
  },

  placePiece: (pieceId: string, topLeft: { r: number; c: number }) => {
    const state = get().levelState;
    if (!state) return false;
    const piece = getPieceById(state.remainingPieces, pieceId);
    if (!piece) return false;
    const occupied = getAbsoluteOccupied(piece.cells, topLeft);
    if (!isValidPlacement(state.gridSize, state.grid, occupied)) return false;

    const placement = createPlacement(pieceId, topLeft, piece.cells);
    const newGrid = state.grid.map((row) => [...row]);
    applyPlacement(newGrid, placement.occupied, 1);
    const newRemaining = state.remainingPieces.filter((p) => p.pieceId !== pieceId);

    set({
      levelState: {
        ...state,
        grid: newGrid,
        remainingPieces: newRemaining,
        placedPlacements: [...state.placedPlacements, placement],
        placedPieces: [...state.placedPieces, piece],
      },
    });
    return true;
  },

  undo: () => {
    const state = get().levelState;
    if (!state || state.placedPlacements.length === 0) return;
    const lastPlacement = state.placedPlacements[state.placedPlacements.length - 1];
    const lastPiece = state.placedPieces[state.placedPieces.length - 1];
    const newGrid = state.grid.map((row) => [...row]);
    clearPlacement(newGrid, lastPlacement.occupied);
    set({
      levelState: {
        ...state,
        grid: newGrid,
        remainingPieces: [...state.remainingPieces, lastPiece],
        placedPlacements: state.placedPlacements.slice(0, -1),
        placedPieces: state.placedPieces.slice(0, -1),
        undosRemaining: state.undosRemaining > 0 ? state.undosRemaining - 1 : state.undosRemaining,
      },
    });
  },

  retryLevel: () => {
    const snapshot = get().initialLevelSnapshot;
    const n = get().currentLevelNumber;
    set({ failureModalVisible: false });
    if (snapshot && snapshot.levelNumber === n) {
      set({
        levelState: {
          levelNumber: snapshot.levelNumber,
          gridSize: snapshot.gridSize,
          grid: snapshot.grid.map((row) => [...row]),
          remainingPieces: [...snapshot.pieces],
          placedPlacements: [],
          placedPieces: [],
          undosRemaining: 1,
        },
      });
    } else {
      get().startNewLevel(n);
    }
  },

  checkFailure: () => {
    const state = get().levelState;
    if (!state || state.remainingPieces.length === 0) return false;
    const { gridSize, grid, remainingPieces } = state;
    for (const piece of remainingPieces) {
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const occupied = getAbsoluteOccupied(piece.cells, { r, c });
          if (isValidPlacement(gridSize, grid, occupied)) return false;
        }
      }
    }
    set({ failureModalVisible: true });
    return true;
  },

  completeLevel: () => {
    const n = get().currentLevelNumber;
    if (n > 0 && n % 4 === 0) {
      set({ interstitialVisible: true, pendingNextLevel: n + 1 });
      MockAdsService.showInterstitial();
    } else {
      get().startNewLevel(n + 1);
    }
  },

  skipLevelRewarded: () => {
    const n = get().currentLevelNumber;
    set({ failureModalVisible: false, rewardedModalPurpose: null });
    get().startNewLevel(n + 1);
    storage.setCurrentLevel(n + 1);
  },


  setSoundEnabled: (v: boolean) => {
    set((s) => {
      const next = { ...s.settings, soundEnabled: v };
      storage.setSettings(next);
      return { settings: next };
    });
  },
  setHapticsEnabled: (v: boolean) => {
    set((s) => {
      const next = { ...s.settings, hapticsEnabled: v };
      storage.setSettings(next);
      return { settings: next };
    });
  },
  setFailureModalVisible: (v: boolean) => set({ failureModalVisible: v }),
  setRewardedModalPurpose: (p: "undo" | "skip" | null) => set({ rewardedModalPurpose: p }),
  onRewardedComplete: () => {
    const purpose = get().rewardedModalPurpose;
    if (purpose === "undo") get().undo();
    if (purpose === "skip") get().skipLevelRewarded();
    set({ rewardedModalPurpose: null });
  },
  onRewardedDismiss: () => set({ rewardedModalPurpose: null }),
  dismissInterstitial: () => {
    const next = get().pendingNextLevel;
    set({ interstitialVisible: false, pendingNextLevel: null });
    if (next != null) get().startNewLevel(next);
  },
}));
