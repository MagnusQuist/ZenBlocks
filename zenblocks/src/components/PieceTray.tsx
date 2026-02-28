/**
 * Tray of remaining pieces. Fixed-height horizontal scroll; drag starts from here.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { PieceView } from "./Piece";
import type { Piece } from "../game/levelGenerator";

const TRAY_CELL_SIZE = 28;
const TRAY_GAP = 10;
/** Extra touch area around each piece so they're easier to grab. */
export const TRAY_HIT_SLOP = 14;

type PieceTrayProps = {
  pieces: Piece[];
  onPieceLayout?: (pieceId: string, x: number, y: number, width: number, height: number) => void;
  renderPiece: (piece: Piece) => React.ReactNode;
};

/** Horizontal ScrollView so the tray keeps a fixed height and scrolls when there are many pieces. */
export function PieceTray({ pieces, onPieceLayout, renderPiece }: PieceTrayProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
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

export function TrayPiecePlaceholder({ piece }: { piece: Piece }) {
  const w = piece.width * TRAY_CELL_SIZE;
  const h = piece.height * TRAY_CELL_SIZE;
  return (
    <View style={[styles.placeholder, { width: w, height: h }]}>
      <PieceView piece={piece} cellSize={TRAY_CELL_SIZE} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: TRAY_GAP,
    paddingHorizontal: 2,
  },
  pieceSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
});

export { TRAY_CELL_SIZE };
