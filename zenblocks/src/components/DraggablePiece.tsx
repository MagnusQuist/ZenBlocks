/**
 * Tray piece with intent-aware drag: scroll vs drag is disambiguated by movement direction.
 * - Horizontal movement past threshold first → tray scroll (drag fails).
 * - Vertical movement past threshold first (or long-press) → drag activates; tray does not scroll.
 * Uses RNGH Gesture API: activeOffsetY / failOffsetX and optional long-press; lift animation on drag start.
 */

import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { runOnJS } from "react-native-reanimated";
import { PieceView } from "./Piece";
import type { Piece } from "../game/levelGenerator";
import { TRAY_CELL_SIZE, TRAY_HIT_SLOP } from "./PieceTray";
import { colors } from "../theme";

// --- Intent gate: disambiguate scroll vs drag (tune here) ---
// Why dx-first → scroll, dy-first → drag: RNGH Pan uses failOffsetX and activeOffsetY.
// If the finger moves horizontally past threshold before moving vertically, the Pan fails
// and the parent ScrollView (horizontal) receives the touch → scroll. If the finger moves
// vertically past threshold first (or stays still for LONG_PRESS_MS), the Pan activates
// and we drag; once active, the gesture owns the touch so the tray does not scroll.
/** Movement (px) past which we decide intent: horizontal first = scroll, vertical first = drag. */
const INTENT_THRESHOLD_PX = 6;
/** Long-press (ms) after which drag is allowed without vertical movement (e.g. user lifts piece in place). */
const LONG_PRESS_MS = 60;
/** Scale when piece is "lifted" during drag (visual feedback). */
const LIFT_SCALE = 1.08;
/** Shadow radius when lifted (stronger glow). */
const LIFT_SHADOW_RADIUS = 14;

type DraggablePieceProps = {
  piece: Piece;
  onDragStart: (piece: Piece, screenX: number, screenY: number) => void;
  onDragMove: (screenX: number, screenY: number) => void;
  onDragEnd: (screenX: number, screenY: number) => void;
  isDragging: boolean;
};

export function DraggablePiece({
  piece,
  onDragStart,
  onDragMove,
  onDragEnd,
  isDragging,
}: DraggablePieceProps) {
  const liftScale = useSharedValue(1);
  const liftShadow = useSharedValue(0);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        // dx past threshold first → fail so ScrollView gets horizontal scroll
        .failOffsetX([-INTENT_THRESHOLD_PX, INTENT_THRESHOLD_PX])
        // dy past threshold first → activate drag (vertical intent)
        .activeOffsetY([-INTENT_THRESHOLD_PX, INTENT_THRESHOLD_PX])
        // Optional: long-press then drag (no movement for LONG_PRESS_MS, then drag activates)
        .activateAfterLongPress(LONG_PRESS_MS)
        .onStart((e) => {
          liftScale.value = withTiming(LIFT_SCALE, { duration: 80 });
          liftShadow.value = withTiming(LIFT_SHADOW_RADIUS, { duration: 80 });
          runOnJS(onDragStart)(piece, e.absoluteX, e.absoluteY);
        })
        .onUpdate((e) => {
          runOnJS(onDragMove)(e.absoluteX, e.absoluteY);
        })
        .onEnd((e) => {
          liftScale.value = withTiming(1, { duration: 120 });
          liftShadow.value = withTiming(0, { duration: 120 });
          runOnJS(onDragEnd)(e.absoluteX, e.absoluteY);
        })
        .onFinalize(() => {
          liftScale.value = withTiming(1, { duration: 120 });
          liftShadow.value = withTiming(0, { duration: 120 });
        }),
    [piece, onDragStart, onDragMove, onDragEnd]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: liftScale.value }],
    shadowOpacity: 0.35,
    shadowRadius: liftShadow.value,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.wrap,
          {
            width: piece.width * TRAY_CELL_SIZE + TRAY_HIT_SLOP * 2,
            height: piece.height * TRAY_CELL_SIZE + TRAY_HIT_SLOP * 2,
            padding: TRAY_HIT_SLOP,
          },
          animatedStyle,
          isDragging && styles.dragging,
        ]}
      >
        <PieceView piece={piece} cellSize={TRAY_CELL_SIZE} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
  },
  dragging: {
    opacity: 0.4,
  },
});
