/**
 * Single piece view: mini-grid of blocks. Used in tray and as drag ghost.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { colors, borderRadius } from "../theme";
import type { Piece as PieceType } from "../game/levelGenerator";

type PieceProps = {
  piece: PieceType;
  cellSize: number;
  style?: object;
};

export function PieceView({ piece, cellSize, style }: PieceProps) {
  const blockSize = cellSize - 2;
  const color = (colors as Record<string, string>)[piece.colorKey] ?? colors.cellFilled;
  const width = piece.width * cellSize;
  const height = piece.height * cellSize;

  return (
    <View style={[styles.wrap, { width, height }, style]}>
      {piece.cells.map((row, r) =>
        row.map((cell, c) =>
          cell === 1 ? (
            <View
              key={`${r}-${c}`}
              style={[
                styles.block,
                {
                  width: blockSize,
                  height: blockSize,
                  left: c * cellSize + 1,
                  top: r * cellSize + 1,
                  backgroundColor: color,
                },
              ]}
            />
          ) : null
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
  },
  block: {
    position: "absolute",
    borderRadius: borderRadius.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
});
