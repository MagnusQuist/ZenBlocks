/**
 * Tray of remaining pieces. Renders mini-grids; drag starts from here.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
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

/** No ScrollView so Pan gesture on pieces isn't stolen; pieces wrap to multiple rows if needed. */
export function PieceTray({ pieces, onPieceLayout, renderPiece }: PieceTrayProps) {
  return (
    <View style={styles.container}>
      <View style={styles.scrollContent}>
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
      </View>
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
    minHeight: 80,
  },
  scrollContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: TRAY_GAP,
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
