/**
 * First-time helper overlay: highlights first piece and animates it onto the board.
 * Non-blocking (pointerEvents="box-none") so the user can start dragging to dismiss.
 */

import React, { useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { PieceView } from "./Piece";
import type { Piece } from "../game/levelGenerator";
import { colors, spacing, typography, borderRadius } from "../theme";

const DURATION_TO_BOARD = 1200;
const DURATION_PAUSE_ON_BOARD = 600;
const DURATION_FADE_OUT = 400;
const DURATION_BEFORE_RESTART = 400;

export type FirstPieceLayoutRect = { x: number; y: number; width: number; height: number };
export type GridLayoutRect = { x: number; y: number; cellSize: number; gridSize: number };

type DragIntroOverlayProps = {
  visible: boolean;
  /** First piece slot bounds in container-relative coords */
  firstPieceLayout: FirstPieceLayoutRect | null;
  /** Grid bounds in container-relative coords */
  gridLayout: GridLayoutRect | null;
  /** First remaining piece */
  piece: Piece | null;
  /** Solution placement for that piece (topLeft) */
  placement: { r: number; c: number } | null;
};

export function DragIntroOverlay({
  visible,
  firstPieceLayout,
  gridLayout,
  piece,
  placement,
}: DragIntroOverlayProps) {
  const insets = useSafeAreaInsets();
  const labelOpacity = useSharedValue(0);
  const ghostLeft = useSharedValue(0);
  const ghostTop = useSharedValue(0);
  const ghostOpacity = useSharedValue(1);
  const highlightOpacity = useSharedValue(0);

  const canAnimate =
    visible &&
    firstPieceLayout &&
    gridLayout &&
    piece &&
    placement != null;

  useEffect(() => {
    if (!visible) return;
    labelOpacity.value = withTiming(1, { duration: 400 });
    highlightOpacity.value = withTiming(1, { duration: 300 });
  }, [visible]);

  const loopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runOneCycleRef = useRef<() => void>(() => {});

  const scheduleNextCycle = useCallback((finished?: boolean) => {
    if (finished === false) return;
    loopRef.current = setTimeout(() => {
      runOneCycleRef.current();
    }, DURATION_BEFORE_RESTART);
  }, []);

  const runOneCycle = useCallback(() => {
    if (!firstPieceLayout || !gridLayout || !piece || placement == null) return;

    const cellSize = gridLayout.cellSize;
    const pieceW = piece.width * cellSize;
    const pieceH = piece.height * cellSize;
    const startLeft =
      firstPieceLayout.x + (firstPieceLayout.width - pieceW) / 2;
    const startTop =
      firstPieceLayout.y + (firstPieceLayout.height - pieceH) / 2;
    const endLeft = gridLayout.x + placement.c * cellSize;
    const endTop = gridLayout.y + placement.r * cellSize;

    ghostLeft.value = startLeft;
    ghostTop.value = startTop;
    ghostOpacity.value = 1;

    const onFadeComplete = (finished?: boolean) => {
      "worklet";
      runOnJS(scheduleNextCycle)(finished);
    };

    ghostLeft.value = withTiming(endLeft, {
      duration: DURATION_TO_BOARD,
      easing: Easing.inOut(Easing.ease),
    });
    ghostTop.value = withTiming(endTop, {
      duration: DURATION_TO_BOARD,
      easing: Easing.inOut(Easing.ease),
    });
    ghostOpacity.value = withDelay(
      DURATION_TO_BOARD + DURATION_PAUSE_ON_BOARD,
      withTiming(0, { duration: DURATION_FADE_OUT }, onFadeComplete)
    );
  }, [firstPieceLayout, gridLayout, piece, placement, scheduleNextCycle]);

  runOneCycleRef.current = runOneCycle;

  useEffect(() => {
    if (!canAnimate || !firstPieceLayout || !gridLayout || !piece || placement == null) return;

    const cellSize = gridLayout.cellSize;
    const pieceW = piece.width * cellSize;
    const pieceH = piece.height * cellSize;
    const startLeft =
      firstPieceLayout.x + (firstPieceLayout.width - pieceW) / 2;
    const startTop =
      firstPieceLayout.y + (firstPieceLayout.height - pieceH) / 2;

    ghostLeft.value = startLeft;
    ghostTop.value = startTop;
    ghostOpacity.value = 1;

    loopRef.current = setTimeout(runOneCycle, 400);
    return () => {
      if (loopRef.current) clearTimeout(loopRef.current);
      loopRef.current = null;
    };
  }, [canAnimate, runOneCycle, firstPieceLayout, gridLayout, piece, placement]);

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const ghostStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: ghostLeft.value,
    top: ghostTop.value,
    opacity: canAnimate ? ghostOpacity.value : 0,
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: firstPieceLayout?.x ?? 0,
    top: firstPieceLayout?.y ?? 0,
    width: firstPieceLayout?.width ?? 0,
    height: firstPieceLayout?.height ?? 0,
    opacity: highlightOpacity.value,
  }));

  if (!visible) return null;

  const labelTopMargin = insets.top + spacing.md;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={[styles.labelWrap, { marginTop: labelTopMargin }, labelStyle]}>
        <Text style={styles.label}>Drag pieces onto the board</Text>
      </Animated.View>

      {firstPieceLayout && (
        <Animated.View style={[styles.highlight, highlightStyle]} pointerEvents="none" />
      )}

      {canAnimate && gridLayout && piece && (
        <Animated.View style={ghostStyle} pointerEvents="none">
          <PieceView piece={piece} cellSize={gridLayout.cellSize} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  labelWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(11, 14, 37, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 212, 0.35)",
  },
  label: {
    ...typography.body,
    color: colors.text,
    fontSize: 15,
  },
  highlight: {
    borderWidth: 3,
    borderColor: colors.accent,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(0, 245, 212, 0.08)",
  },
});
