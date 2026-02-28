/**
 * Tray of remaining pieces.
 * Clean Neon Night shelf style (no double container).
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import type { Piece } from "../game/levelGenerator";
import { spacing } from "../theme";

const TRAY_CELL_SIZE = 26;
const TRAY_GAP = 4;

export const TRAY_HIT_SLOP = 14;

type PieceTrayProps = {
  pieces: Piece[];
  onPieceLayout?: (pieceId: string, x: number, y: number, width: number, height: number) => void;
  renderPiece: (piece: Piece) => React.ReactNode;
};

export function PieceTray({ pieces, onPieceLayout, renderPiece }: PieceTrayProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {pieces.map((piece) => (
          <PieceSlot
            key={piece.pieceId}
            piece={piece}
            onLayout={onPieceLayout}
            slotWidth={piece.width * TRAY_CELL_SIZE + TRAY_HIT_SLOP * 2}
            slotHeight={piece.height * TRAY_CELL_SIZE + TRAY_HIT_SLOP * 2}
          >
            {renderPiece(piece)}
          </PieceSlot>
        ))}
      </ScrollView>
    </View>
  );
}

function PieceSlot({
  piece,
  onLayout,
  slotWidth,
  slotHeight,
  children,
}: {
  piece: Piece;
  onLayout?: (pieceId: string, x: number, y: number, w: number, h: number) => void;
  slotWidth: number;
  slotHeight: number;
  children: React.ReactNode;
}) {
  const ref = React.useRef<View>(null);

  const onSlotLayout = React.useCallback(() => {
    ref.current?.measureInWindow((x, y, width, height) => {
      onLayout?.(piece.pieceId, x, y, width, height);
    });
  }, [piece.pieceId, onLayout]);

  return (
    <View
      ref={ref}
      style={[styles.pieceSlot, { width: slotWidth, height: slotHeight }]}
      onLayout={onSlotLayout}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: TRAY_GAP,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  pieceSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export { TRAY_CELL_SIZE };