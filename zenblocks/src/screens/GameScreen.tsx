/**
 * Main game screen: grid, tray, drag/snap, undo, completion & failure handling.
 */

import React, { useCallback, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useGameStore } from "../state/gameStore";
import type { GridLayout } from "../components/Grid";
import { Grid } from "../components/Grid";
import { LevelHeader } from "../components/LevelHeader";
import { PieceTray } from "../components/PieceTray";
import { PieceView } from "../components/Piece";
import { DraggablePiece } from "../components/DraggablePiece";
import { FailureModal } from "../components/FailureModal";
import { RewardedModal } from "../components/RewardedModal";
import { Confetti } from "../components/Confetti";
import { getAbsoluteOccupied, isValidPlacement } from "../game/gridUtils";
import type { Piece } from "../game/levelGenerator";
import { colors, spacing, typography, borderRadius } from "../theme";
import { MockAdsService } from "../services/ads";
import * as haptics from "../services/haptics";
import * as sound from "../services/sound";

const SNAP_DURATION = 100;
/** Offset ghost above the finger so the user doesn't have to reach as far to see/place the piece. */
const DRAG_GHOST_OFFSET_Y = -96;
const DRAG_GHOST_OFFSET_X = 0;
/** Amplify finger movement so the ghost moves faster and feels snappier (1 = no amplification). */
const DRAG_ACCELERATION = 2.2;

function screenToGrid(
  layout: GridLayout | null,
  screenX: number,
  screenY: number
): { r: number; c: number } | null {
  if (!layout) return null;
  const c = Math.floor((screenX - layout.x) / layout.cellSize);
  const r = Math.floor((screenY - layout.y) / layout.cellSize);
  if (r < 0 || r >= layout.gridSize || c < 0 || c >= layout.gridSize) return null;
  return { r, c };
}

/** Finger position in grid coords (may be out of bounds). */
function screenToGridUnclamped(
  layout: GridLayout | null,
  screenX: number,
  screenY: number
): { r: number; c: number } | null {
  if (!layout) return null;
  const c = Math.floor((screenX - layout.x) / layout.cellSize);
  const r = Math.floor((screenY - layout.y) / layout.cellSize);
  return { r, c };
}

const SNAP_RADIUS = 2;

/** Clamp ghost center (screen coords) so the piece stays inside the container. */
function clampGhostToBounds(
  ghostX: number,
  ghostY: number,
  piece: Piece,
  cellSize: number,
  containerX: number,
  containerY: number,
  containerW: number,
  containerH: number
): { x: number; y: number } {
  const halfW = (piece.width * cellSize) / 2;
  const halfH = (piece.height * cellSize) / 2;
  const minX = containerX + halfW;
  const maxX = containerX + containerW - halfW;
  const minY = containerY + halfH;
  const maxY = containerY + containerH - halfH;
  return {
    x: Math.max(minX, Math.min(maxX, ghostX)),
    y: Math.max(minY, Math.min(maxY, ghostY)),
  };
}

/**
 * Find best anchor for the piece so it fits on the grid, with finger at piece center.
 * Tries center-based anchor first, then neighbors within SNAP_RADIUS for a larger snap area.
 */
function findBestAnchor(
  gridSize: number,
  grid: number[][],
  piece: Piece,
  fingerCell: { r: number; c: number }
): { r: number; c: number } | null {
  const centerR = Math.floor((piece.height - 1) / 2);
  const centerC = Math.floor((piece.width - 1) / 2);
  const preferred = {
    r: fingerCell.r - centerR,
    c: fingerCell.c - centerC,
  };
  const occupied = getAbsoluteOccupied(piece.cells, preferred);
  if (isValidPlacement(gridSize, grid, occupied)) return preferred;

  const deltas: { dr: number; dc: number }[] = [];
  for (let dr = -SNAP_RADIUS; dr <= SNAP_RADIUS; dr++) {
    for (let dc = -SNAP_RADIUS; dc <= SNAP_RADIUS; dc++) {
      if (dr === 0 && dc === 0) continue;
      deltas.push({ dr, dc });
    }
  }
  deltas.sort((a, b) => Math.abs(a.dr) + Math.abs(a.dc) - (Math.abs(b.dr) + Math.abs(b.dc)));

  for (const { dr, dc } of deltas) {
    const anchor = { r: preferred.r + dr, c: preferred.c + dc };
    const occ = getAbsoluteOccupied(piece.cells, anchor);
    if (isValidPlacement(gridSize, grid, occ)) return anchor;
  }
  return null;
}

export default function GameScreen() {
  const levelState = useGameStore((s) => s.levelState);
  const currentLevelNumber = useGameStore((s) => s.currentLevelNumber);
  const settings = useGameStore((s) => s.settings);
  const placePiece = useGameStore((s) => s.placePiece);
  const undo = useGameStore((s) => s.undo);
  const retryLevel = useGameStore((s) => s.retryLevel);
  const checkFailure = useGameStore((s) => s.checkFailure);
  const completeLevel = useGameStore((s) => s.completeLevel);
  const setFailureModalVisible = useGameStore((s) => s.setFailureModalVisible);
  const setRewardedModalPurpose = useGameStore((s) => s.setRewardedModalPurpose);
  const onRewardedComplete = useGameStore((s) => s.onRewardedComplete);
  const onRewardedDismiss = useGameStore((s) => s.onRewardedDismiss);
  const failureModalVisible = useGameStore((s) => s.failureModalVisible);
  const rewardedModalPurpose = useGameStore((s) => s.rewardedModalPurpose);
  const interstitialVisible = useGameStore((s) => s.interstitialVisible);
  const dismissInterstitial = useGameStore((s) => s.dismissInterstitial);

  const [gridLayout, setGridLayout] = useState<GridLayout | null>(null);
  const gridLayoutRef = useRef<GridLayout | null>(null);
  gridLayoutRef.current = gridLayout;
  const [draggingPiece, setDraggingPiece] = useState<Piece | null>(null);
  const [dragScreenPosition, setDragScreenPosition] = useState<{ x: number; y: number } | null>(null);
  const [highlightCells, setHighlightCells] = useState<Array<{ r: number; c: number }>>([]);
  const containerWindow = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerSize = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const ghostScale = useSharedValue(1);
  const containerRef = useRef<View>(null);
  const pieceLayouts = useRef<Map<string, { x: number; y: number; w: number; h: number }>>(new Map());
  const lastFingerRef = useRef<{ x: number; y: number } | null>(null);
  const ghostPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [showCompletionRipple, setShowCompletionRipple] = useState(false);
  const insets = useSafeAreaInsets();

  const ghostAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ghostScale.value }],
  }));

  const handlePlacementResult = useCallback(
    (success: boolean) => {
      if (success) {
        if (settings.hapticsEnabled) haptics.impactLight();
        if (settings.soundEnabled) sound.playTap();
        const state = useGameStore.getState().levelState;
        const grid = state?.grid;
        const justFilled =
          grid != null &&
          grid.flat().every((v) => v !== 0);
        if (justFilled) {
          if (settings.soundEnabled) sound.playSuccess();
          setShowCompletionRipple(true);
          setTimeout(() => {
            setShowCompletionRipple(false);
            completeLevel();
          }, 1500);
        } else {
          const failed = checkFailure();
          if (!failed) setHighlightCells([]);
        }
      }
      setDraggingPiece(null);
      setDragScreenPosition(null);
      setHighlightCells([]);
    },
    [settings, checkFailure, completeLevel]
  );

  const updateHighlight = useCallback(
    (ghostCenterX: number, ghostCenterY: number) => {
      const layout = gridLayoutRef.current;
      const ghostCell = layout ? screenToGridUnclamped(layout, ghostCenterX, ghostCenterY) : null;
      if (!ghostCell || !draggingPiece || !levelState) {
        setHighlightCells([]);
        return;
      }
      const anchor = findBestAnchor(
        levelState.gridSize,
        levelState.grid,
        draggingPiece,
        ghostCell
      );
      if (!anchor) {
        setHighlightCells([]);
        return;
      }
      setHighlightCells(getAbsoluteOccupied(draggingPiece.cells, anchor));
    },
    [draggingPiece, levelState]
  );

  const reportPieceLayout = useCallback((pieceId: string, x: number, y: number, w: number, h: number) => {
    pieceLayouts.current.set(pieceId, { x, y, w, h });
  }, []);

  const startDrag = useCallback((piece: Piece, screenX: number, screenY: number) => {
    const ghost = {
      x: screenX + DRAG_GHOST_OFFSET_X,
      y: screenY + DRAG_GHOST_OFFSET_Y,
    };
    const layout = gridLayoutRef.current;
    const cw = containerWindow.current;
    const cs = containerSize.current;
    const clamped =
      layout && cs.width > 0 && cs.height > 0
        ? clampGhostToBounds(
          ghost.x,
          ghost.y,
          piece,
          layout.cellSize,
          cw.x,
          cw.y,
          cs.width,
          cs.height
        )
        : ghost;
    lastFingerRef.current = { x: screenX, y: screenY };
    ghostPositionRef.current = clamped;
    setDraggingPiece(piece);
    setDragScreenPosition(clamped);
  }, []);

  const handleDragMove = useCallback(
    (screenX: number, screenY: number) => {
      const last = lastFingerRef.current;
      const prevGhost = ghostPositionRef.current;
      const dx = (screenX - (last?.x ?? screenX)) * DRAG_ACCELERATION;
      const dy = (screenY - (last?.y ?? screenY)) * DRAG_ACCELERATION;
      const ghost = { x: prevGhost.x + dx, y: prevGhost.y + dy };
      const layout = gridLayoutRef.current;
      const piece = draggingPiece;
      const cw = containerWindow.current;
      const cs = containerSize.current;
      const clamped =
        layout && piece && cs.width > 0 && cs.height > 0
          ? clampGhostToBounds(
            ghost.x,
            ghost.y,
            piece,
            layout.cellSize,
            cw.x,
            cw.y,
            cs.width,
            cs.height
          )
          : ghost;
      lastFingerRef.current = { x: screenX, y: screenY };
      ghostPositionRef.current = clamped;
      setDragScreenPosition(clamped);
      updateHighlight(clamped.x, clamped.y);
    },
    [updateHighlight, draggingPiece]
  );

  const handleDrop = useCallback(
    (absoluteX: number, absoluteY: number) => {
      const piece = draggingPiece;
      const layout = gridLayoutRef.current;
      const state = useGameStore.getState().levelState;
      if (!piece || !layout || !state) {
        handlePlacementResult(false);
        return;
      }
      const last = lastFingerRef.current;
      const prevGhost = ghostPositionRef.current;
      const dx = (absoluteX - (last?.x ?? absoluteX)) * DRAG_ACCELERATION;
      const dy = (absoluteY - (last?.y ?? absoluteY)) * DRAG_ACCELERATION;
      const ghostX = prevGhost.x + dx;
      const ghostY = prevGhost.y + dy;
      const ghostCell = screenToGridUnclamped(layout, ghostX, ghostY);
      if (!ghostCell) {
        handlePlacementResult(false);
        return;
      }
      const anchor = findBestAnchor(state.gridSize, state.grid, piece, ghostCell);
      if (anchor) {
        ghostScale.value = withTiming(1.02, { duration: 50 }, () => {
          ghostScale.value = withTiming(1, { duration: SNAP_DURATION });
        });
        const success = placePiece(piece.pieceId, anchor);
        handlePlacementResult(success);
        return;
      }
      handlePlacementResult(false);
    },
    [draggingPiece, placePiece, handlePlacementResult, ghostScale]
  );


  const handleUndoPress = useCallback(() => {
    const state = useGameStore.getState().levelState;
    if (!state) return;
    if (state.undosRemaining > 0) {
      if (state.placedPlacements.length > 0) {
        undo();
        if (settings.hapticsEnabled) haptics.notificationTick();
        if (settings.soundEnabled) sound.playUndo();
      }
    } else {
      setRewardedModalPurpose("undo");
    }
  }, [undo, settings, setRewardedModalPurpose]);

  const handleWatchAdForUndo = useCallback(async () => {
    const result = await MockAdsService.showRewarded();
    if (result === "completed") {
      onRewardedComplete();
    } else {
      onRewardedDismiss();
    }
  }, [onRewardedComplete, onRewardedDismiss]);

  const handleSkipWatchAd = useCallback(async () => {
    const result = await MockAdsService.showRewarded();
    if (result === "completed") {
      onRewardedComplete();
    } else {
      onRewardedDismiss();
    }
  }, [onRewardedComplete, onRewardedDismiss]);

  const onContainerLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = e.nativeEvent.layout;
      containerSize.current = { width, height };
      containerRef.current?.measureInWindow((x, y) => {
        containerWindow.current = { x, y };
      });
    },
    []
  );

  if (!levelState) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left + spacing.md, paddingRight: insets.right + spacing.md }]}>
        <Text style={styles.loading}>Loading…</Text>
      </View>
    );
  }

  const undosRemaining = levelState.undosRemaining;
  const canUndo = levelState.placedPlacements.length > 0;

  return (
    <View style={styles.container} ref={containerRef} onLayout={onContainerLayout}>
      <View
        style={[
          styles.contentArea,
          {
            paddingTop: insets.top,
            paddingLeft: insets.left + spacing.md,
            paddingRight: insets.right + spacing.md,
          },
        ]}
      >
        <LevelHeader levelNumber={currentLevelNumber} />
        <View style={styles.gridArea}>
          <Grid
            key={`grid-${levelState.levelNumber}-${levelState.gridSize}`}
            gridSize={levelState.gridSize}
            grid={levelState.grid}
            placedPlacements={levelState.placedPlacements}
            placedPieces={levelState.placedPieces}
            onLayout={setGridLayout}
            highlightCells={highlightCells}
            showCompletionRipple={showCompletionRipple}
          />
        </View>

        <View style={styles.undoRow}>
          <TouchableOpacity
            style={[
              styles.undoBtn,
              !canUndo && undosRemaining === 0 && styles.undoBtnDisabled,
            ]}
            onPress={handleUndoPress}
            disabled={!canUndo && undosRemaining === 0}
          >
            <Text
              style={[
                styles.undoText,
                !canUndo && undosRemaining === 0 && styles.undoTextDisabled,
              ]}
            >
              Undo {undosRemaining > 0 ? `(${undosRemaining})` : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.drawer, { height: 152 + insets.bottom }]}>
        <View
          style={[
            styles.drawerInner,
            {
              paddingTop: spacing.md,
              paddingBottom: insets.bottom + spacing.md,
              paddingLeft: insets.left + spacing.md,
              paddingRight: insets.right + spacing.md,
            },
          ]}
        >
          <PieceTray
            pieces={levelState.remainingPieces}
            onPieceLayout={reportPieceLayout}
            renderPiece={(piece) => (
              <DraggablePiece
                piece={piece}
                onDragStart={startDrag}
                onDragMove={handleDragMove}
                onDragEnd={handleDrop}
                isDragging={draggingPiece?.pieceId === piece.pieceId}
              />
            )}
          />
        </View>
      </View>

      <Confetti visible={showCompletionRipple} />

      {draggingPiece && gridLayout && dragScreenPosition && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ghostWrap,
            {
              left:
                dragScreenPosition.x -
                containerWindow.current.x -
                (draggingPiece.width * gridLayout.cellSize) / 2,
              top:
                dragScreenPosition.y -
                containerWindow.current.y -
                (draggingPiece.height * gridLayout.cellSize) / 2,
            },
            ghostAnimatedStyle,
          ]}
        >
          <PieceView
            piece={draggingPiece}
            cellSize={gridLayout.cellSize}
          />
        </Animated.View>
      )}

      <FailureModal
        visible={failureModalVisible}
        onRetry={retryLevel}
        onSkipWatchAd={() => {
          setFailureModalVisible(false);
          setRewardedModalPurpose("skip");
        }}
      />
      <RewardedModal
        visible={rewardedModalPurpose !== null}
        purpose={rewardedModalPurpose}
        onWatch={
          rewardedModalPurpose === "undo"
            ? handleWatchAdForUndo
            : rewardedModalPurpose === "skip"
              ? handleSkipWatchAd
              : () => { }
        }
        onDismiss={onRewardedDismiss}
      />

      {interstitialVisible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View style={styles.interstitialOverlay}>
            <View style={styles.interstitialCard}>
              <Text style={styles.interstitialTitle}>Ad</Text>
              <TouchableOpacity style={styles.interstitialBtn} onPress={dismissInterstitial}>
                <Text style={styles.interstitialBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentArea: {
    flex: 1,
  },
  loading: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  gridArea: {
    flex: 1,
    minHeight: 240,
  },
  ghostWrap: {
    position: "absolute",
    zIndex: 100,
  },
  undoRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  undoBtn: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  undoText: {
    ...typography.caption,
    color: "#FFF",
    fontWeight: "600",
  },
  undoBtnDisabled: {
    backgroundColor: colors.cellEmpty,
    opacity: 0.9,
  },
  undoTextDisabled: {
    color: colors.textMuted,
  },
  drawer: {
    width: "100%",
    backgroundColor: colors.drawer,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.drawerBorder,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerInner: {
    flex: 1,
  },
  trayPieceWrap: {
    alignSelf: "flex-start",
  },
  interstitialOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26, 21, 32, 0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  interstitialCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    minWidth: 280,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.drawerBorder,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  interstitialTitle: {
    ...typography.header,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  interstitialBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  interstitialBtnText: {
    ...typography.button,
    color: "#FFF",
  },
});
