/**
 * Single piece view: mini-grid of blocks. Used in tray and as drag ghost.
 * Neon Night polish:
 * - subtle neon outline
 * - inner highlight (glassy)
 * - color-based shadow so pieces pop on dark UI
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
                  borderColor: "rgba(255,255,255,0.18)",
                  shadowColor: color,
                },
              ]}
            >
              {/* inner highlight */}
              <View style={styles.innerHighlight} />
            </View>
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
    borderWidth: 1,

    // neon pop shadow (per block)
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
    overflow: "hidden",
  },
  innerHighlight: {
    position: "absolute",
    left: 2,
    top: 2,
    right: 2,
    height: "40%",
    borderRadius: borderRadius.sm,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
});