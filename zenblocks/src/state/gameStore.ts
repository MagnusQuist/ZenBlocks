/**
 * Zustand game store: settings, progression, active level state, scoring.
 * Persists currentLevelNumber, settings, and score data to AsyncStorage.
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
import { computeLevelScore } from "../game/scoring";
import type { BestLevelScoreByLevelId } from "../services/storage";
import * as storage from "../services/storage";
import type { SolutionPlacement } from "../game/solution";
import type { TitleMilestoneId } from "../data/titleUnlocks";
import {
  getHighestUnlockedTitleId,
  getTitleById,
  isTitleUnlocked,
  TITLE_MILESTONES,
} from "../data/titleUnlocks";
import { MockAdsService } from "../services/ads";
import * as haptics from "../services/haptics";
import * as sound from "../services/sound";

export type CompletionOverlayData = {
  baseScore: number;
  cleanMultiplier: number;
  streakMultiplier: number;
  /** Streak count after this completion (e.g. 4 = "4 in a row"). */
  nextStreak: number;
  finalLevelScore: number;
  totalScore: number;
  bestTotalScore: number;
};

export type LevelState = {
  levelNumber: number;
  gridSize: number;
  grid: number[][];
  remainingPieces: Piece[];
  placedPlacements: Placement[];
  placedPieces: Piece[]; // same order as placedPlacements, for undo restore
  undosRemaining: number;
  solution: SolutionPlacement[];
};

/** Snapshot of level start: empty grid + all pieces, for retry (same pieces). */
export type InitialLevelSnapshot = {
  levelNumber: number;
  gridSize: number;
  grid: number[][];
  pieces: Piece[];
  solution: SolutionPlacement[];
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
  rewardedModalPurpose: "undo" | "skip" | "hint" | null;
  interstitialVisible: boolean;
  pendingNextLevel: number | null;
  usedUndoThisLevel: boolean;
  /** True if the player restarted the current level. */
  restartedThisLevel: boolean;
  consecutiveNoUndoCompletions: number;

  /** Hint: 1 free per level; more via rewarded ad. */
  freeHintUsedThisLevel: boolean;
  adHintsEarnedThisLevel: number;
  /** Current hint placement to show on grid (cleared on place or new level). */
  hintPlacement: { pieceId: string; topLeft: { r: number; c: number } } | null;

  // scoring
  totalScore: number;
  bestTotalScore: number;
  bestLevelScoreByLevelId: BestLevelScoreByLevelId;
  lastLevelScore: number;
  completionOverlayVisible: boolean;
  completionOverlayData: CompletionOverlayData | null;
  showInterstitialAfterOverlay: boolean;

  // titles (unlocks)
  selectedTitleId: string | null;
  seenTitleIds: string[];

  // actions
  initApp: () => Promise<void>;
  hydrateScores: () => Promise<void>;
  setSelectedTitleId: (id: TitleMilestoneId | null) => void;
  markUnlocksScreenSeen: () => void;
  startNewLevel: (levelNumber: number) => void;
  placePiece: (pieceId: string, topLeft: { r: number; c: number }) => boolean;
  undo: () => void;
  retryLevel: () => void;
  checkFailure: () => boolean;
  completeLevel: () => void;
  dismissCompletionOverlay: () => void;
  markUndoUsed: () => void;
  markRestarted: () => void;
  skipLevelRewarded: () => void;
  setSoundEnabled: (v: boolean) => void;
  setHapticsEnabled: (v: boolean) => void;
  setFailureModalVisible: (v: boolean) => void;
  setRewardedModalPurpose: (p: "undo" | "skip" | "hint" | null) => void;
  /** Consume one hint (free or ad). Returns true if a hint was available. */
  useHint: () => boolean;
  grantHintFromAd: () => void;
  setHintPlacement: (placement: { pieceId: string; topLeft: { r: number; c: number } } | null) => void;
  clearHintPlacement: () => void;
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
  usedUndoThisLevel: false,
  restartedThisLevel: false,
  consecutiveNoUndoCompletions: 0,

  freeHintUsedThisLevel: false,
  adHintsEarnedThisLevel: 0,
  hintPlacement: null,

  totalScore: 0,
  bestTotalScore: 0,
  bestLevelScoreByLevelId: {},
  lastLevelScore: 0,
  completionOverlayVisible: false,
  completionOverlayData: null,
  showInterstitialAfterOverlay: false,

  selectedTitleId: null,
  seenTitleIds: [],

  initApp: async () => {
    const [level, settings, consecutiveNoUndo, selectedTitleId, seenTitleIds] = await Promise.all([
      storage.getCurrentLevel(),
      storage.getSettings(),
      storage.getConsecutiveNoUndoCompletions(),
      storage.getSelectedTitleId(),
      storage.getSeenTitleIds(),
    ]);
    set({
      currentLevelNumber: level,
      settings,
      consecutiveNoUndoCompletions: consecutiveNoUndo,
      selectedTitleId: selectedTitleId || null,
      seenTitleIds: seenTitleIds ?? [],
    });
    await get().hydrateScores();
    const total = get().totalScore;
    const highestId = getHighestUnlockedTitleId(total);
    const currentSelected = get().selectedTitleId;
    const validSelected =
      currentSelected &&
      isTitleUnlocked(total, currentSelected as TitleMilestoneId)
        ? currentSelected
        : highestId;
    if (validSelected !== currentSelected) {
      set({ selectedTitleId: validSelected });
      await storage.setSelectedTitleId(validSelected);
    }
    get().startNewLevel(level);
  },

  hydrateScores: async () => {
    const [total, bestTotal, bestByLevel] = await Promise.all([
      storage.getTotalScore(),
      storage.getBestTotalScore(),
      storage.getBestLevelScoreByLevelId(),
    ]);
    set({
      totalScore: total,
      bestTotalScore: bestTotal,
      bestLevelScoreByLevelId: bestByLevel,
    });
  },

  setSelectedTitleId: (id: TitleMilestoneId | null) => {
    const total = get().totalScore;
    if (id && !isTitleUnlocked(total, id)) return;
    const safe = id ?? getHighestUnlockedTitleId(total);
    set({ selectedTitleId: safe });
    storage.setSelectedTitleId(safe);
  },

  markUnlocksScreenSeen: () => {
    const total = get().totalScore;
    const unlocked = TITLE_MILESTONES.filter((t) => total >= t.requiredScore).map((t) => t.id);
    set({ seenTitleIds: unlocked });
    storage.setSeenTitleIds(unlocked);
  },

  startNewLevel: (levelNumber: number) => {
    const { gridSize, grid, pieces, solution } = generateLevel(levelNumber);
    const emptyGrid = grid.map((row) => [...row]);
    const snapshot: InitialLevelSnapshot = {
      levelNumber,
      gridSize,
      grid: emptyGrid.map((row) => [...row]),
      pieces,
      solution,
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
        solution,
      },
      initialLevelSnapshot: snapshot,
      failureModalVisible: false,
      rewardedModalPurpose: null,
      usedUndoThisLevel: false,
      restartedThisLevel: false,
      freeHintUsedThisLevel: false,
      adHintsEarnedThisLevel: 0,
      hintPlacement: null,
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
      hintPlacement: null,
    });
    return true;
  },

  useHint: () => {
    const { freeHintUsedThisLevel, adHintsEarnedThisLevel } = get();
    if (!freeHintUsedThisLevel) {
      set({ freeHintUsedThisLevel: true });
      return true;
    }
    if (adHintsEarnedThisLevel > 0) {
      set({ adHintsEarnedThisLevel: adHintsEarnedThisLevel - 1 });
      return true;
    }
    return false;
  },

  grantHintFromAd: () => {
    set({ adHintsEarnedThisLevel: get().adHintsEarnedThisLevel + 1 });
  },

  setHintPlacement: (placement) => {
    set({ hintPlacement: placement });
  },

  clearHintPlacement: () => {
    set({ hintPlacement: null });
  },

  undo: () => {
    const state = get().levelState;
    if (!state || state.placedPlacements.length === 0) return;
    const hadStreak = get().consecutiveNoUndoCompletions >= 2;
    const lastPlacement = state.placedPlacements[state.placedPlacements.length - 1];
    const lastPiece = state.placedPieces[state.placedPieces.length - 1];
    const newGrid = state.grid.map((row) => [...row]);
    clearPlacement(newGrid, lastPlacement.occupied);
    set({
      usedUndoThisLevel: true,
      ...(hadStreak ? { consecutiveNoUndoCompletions: 0 } : {}),
      levelState: {
        ...state,
        grid: newGrid,
        remainingPieces: [...state.remainingPieces, lastPiece],
        placedPlacements: state.placedPlacements.slice(0, -1),
        placedPieces: state.placedPieces.slice(0, -1),
        undosRemaining: state.undosRemaining > 0 ? state.undosRemaining - 1 : state.undosRemaining,
      },
    });
    if (hadStreak) storage.setConsecutiveNoUndoCompletions(0);
  },

  retryLevel: () => {
    const snapshot = get().initialLevelSnapshot;
    const n = get().currentLevelNumber;
    set({
      failureModalVisible: false,
      consecutiveNoUndoCompletions: 0,
      restartedThisLevel: true,
    });
    storage.setConsecutiveNoUndoCompletions(0);
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
          solution: snapshot.solution,
        },
        freeHintUsedThisLevel: false,
        adHintsEarnedThisLevel: 0,
        hintPlacement: null,
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
    const levelState = get().levelState;
    if (!levelState) return;

    const usedUndo = get().usedUndoThisLevel;
    const restarted = get().restartedThisLevel;
    const streakCount = get().consecutiveNoUndoCompletions;
    const streakActive = streakCount >= 2;
    const nextStreak = usedUndo ? 0 : streakCount + 1;

    const breakdown = computeLevelScore(
      levelState.gridSize,
      levelState.gridSize,
      usedUndo,
      restarted,
      streakActive,
      streakCount
    );

    const newTotal = get().totalScore + breakdown.finalLevelScore;
    const newBestTotal = Math.max(get().bestTotalScore, newTotal);
    const bestByLevel = { ...get().bestLevelScoreByLevelId };
    const prevBest = bestByLevel[n] ?? 0;
    bestByLevel[n] = Math.max(prevBest, breakdown.finalLevelScore);

    set({
      totalScore: newTotal,
      bestTotalScore: newBestTotal,
      bestLevelScoreByLevelId: bestByLevel,
      lastLevelScore: breakdown.finalLevelScore,
      usedUndoThisLevel: false,
      restartedThisLevel: false,
      consecutiveNoUndoCompletions: nextStreak,
      completionOverlayVisible: true,
      completionOverlayData: {
        baseScore: breakdown.baseScore,
        cleanMultiplier: breakdown.cleanMultiplier,
        streakMultiplier: breakdown.streakMultiplier,
        nextStreak,
        finalLevelScore: breakdown.finalLevelScore,
        totalScore: newTotal,
        bestTotalScore: newBestTotal,
      },
      pendingNextLevel: n + 1,
      showInterstitialAfterOverlay: n > 0 && n % 4 === 0,
    });
    storage.setConsecutiveNoUndoCompletions(nextStreak);
    storage.setTotalScore(newTotal);
    storage.setBestTotalScore(newBestTotal);
    storage.setBestLevelScoreByLevelId(bestByLevel);
  },

  dismissCompletionOverlay: () => {
    const next = get().pendingNextLevel;
    const showAd = get().showInterstitialAfterOverlay;
    set({
      completionOverlayVisible: false,
      completionOverlayData: null,
      showInterstitialAfterOverlay: false,
    });
    if (showAd && next != null) {
      set({ interstitialVisible: true });
      MockAdsService.showInterstitial();
    } else if (next != null) {
      get().startNewLevel(next);
    }
  },

  markUndoUsed: () => set({ usedUndoThisLevel: true }),
  markRestarted: () => set({ restartedThisLevel: true }),

  skipLevelRewarded: () => {
    const n = get().currentLevelNumber;
    set({ failureModalVisible: false, rewardedModalPurpose: null, consecutiveNoUndoCompletions: 0 });
    storage.setConsecutiveNoUndoCompletions(0);
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
  setRewardedModalPurpose: (p: "undo" | "skip" | "hint" | null) => set({ rewardedModalPurpose: p }),
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
