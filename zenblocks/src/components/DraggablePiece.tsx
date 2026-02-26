/**
 * A single tray piece that can be dragged after a long-press.
 * Uses activateAfterLongPress so the horizontal ScrollView doesn't steal the gesture.
 * Reports finger position in screen coords (absoluteX/absoluteY) so parent can position ghost.
 */

import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { PieceView } from "./Piece";
import type { Piece } from "../game/levelGenerator";
import { TRAY_CELL_SIZE, TRAY_HIT_SLOP } from "./PieceTray";

/** Small movement to start drag (no long-press now that tray has no ScrollView). */
const MIN_DRAG_DISTANCE = 8;

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
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(MIN_DRAG_DISTANCE)
        .onStart((e) => {
          scheduleOnRN(onDragStart, piece, e.absoluteX, e.absoluteY);
        })
        .onUpdate((e) => {
          scheduleOnRN(onDragMove, e.absoluteX, e.absoluteY);
        })
        .onEnd((e) => {
          scheduleOnRN(onDragEnd, e.absoluteX, e.absoluteY);
        }),
    [piece, onDragStart, onDragMove, onDragEnd]
  );

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
