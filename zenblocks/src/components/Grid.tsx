/**
 * Grid board: measures layout, renders cells and placed pieces.
 * Reports cell size and origin for drag/snap coordinate conversion.
 * Completion ripple: when showCompletionRipple is true, each filled 1x1 block
 * runs a staggered scale/opacity animation so the ripple waves across the board.
 */

import React, { useCallback, useEffect, useMemo } from "react";
import { View, StyleSheet, LayoutChangeEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  type SharedValue,
} from "react-native-reanimated";
import { colors, spacing, borderRadius } from "../theme";
import type { Piece } from "../game/levelGenerator";
import type { Placement } from "../game/placement";

type GridLayout = {
  x: number;
  y: number;
  cellSize: number;
  gridSize: number;
};

type GridProps = {
  gridSize: number;
  grid: number[][];
  placedPlacements: Placement[];
  placedPieces: Piece[];
  onLayout?: (layout: GridLayout) => void;
  highlightCells?: Array<{ r: number; c: number }>;
  padding?: number;
  showCompletionRipple?: boolean;
};

const RIPPLE_DURATION_MS = 1300;
const RIPPLE_WAVE_SPAN = 0.25;

function RippleBlock({
  cellIndex,
  totalCells,
  rippleProgress,
  left,
  top,
  size,
}: {
  cellIndex: number;
  totalCells: number;
  rippleProgress: SharedValue<number>;
  left: number;
  top: number;
  size: number;
}) {
  const style = useAnimatedStyle(() => {
    "worklet";
    const p = rippleProgress.value;
    const waveStart = cellIndex / totalCells;
    const waveEnd = waveStart + RIPPLE_WAVE_SPAN;
    const t = (p - waveStart) / (waveEnd - waveStart);
    const myProgress = Math.max(0, Math.min(1, t));
    const scale = 1 + myProgress * 0.35;
    const opacity = 0.9 - myProgress * 0.9;
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.rippleBlock,
        {
          left,
          top,
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}

export function Grid({
  gridSize,
  grid,
  placedPlacements,
  placedPieces,
  onLayout,
  highlightCells = [],
  padding = spacing.md,
  showCompletionRipple = false,
}: GridProps) {
  const rippleProgress = useSharedValue(0);

  const filledCells = useMemo(() => {
    const out: { r: number; c: number }[] = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
        if (grid[r][c] !== 0) out.push({ r, c });
      }
    }
    return out;
  }, [grid]);

  useEffect(() => {
    if (showCompletionRipple && filledCells.length > 0) {
      rippleProgress.value = 0;
      rippleProgress.value = withTiming(1.2, {
        duration: RIPPLE_DURATION_MS,
        easing: Easing.bezier(0.33, 0, 0.2, 1),
      });
    }
  }, [showCompletionRipple, filledCells.length, rippleProgress]);

  const [layout, setLayout] = React.useState<{
    localX: number;
    localY: number;
    cellSize: number;
    gridSize: number;
  } | null>(null);
  const gridWrapRef = React.useRef<View>(null);

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      const available = Math.min(width, height) - padding * 2;
      const cellSize = Math.floor(available / gridSize);
      const totalSize = cellSize * gridSize;
      const localX = (width - totalSize) / 2;
      const localY = (height - totalSize) / 2;
      setLayout({ localX, localY, cellSize, gridSize });
    },
    [gridSize, padding]
  );

  React.useEffect(() => {
    if (!layout) return;
    gridWrapRef.current?.measureInWindow((wx, wy) => {
      onLayout?.({ x: wx, y: wy, cellSize: layout.cellSize, gridSize: layout.gridSize });
    });
  }, [layout, onLayout]);

  const highlightSet = React.useMemo(() => {
    const s = new Set<string>();
    highlightCells.forEach(({ r, c }) => s.add(`${r},${c}`));
    return s;
  }, [highlightCells]);

  const pieceByPieceId = React.useMemo(() => {
    const m = new Map<string, Piece>();
    placedPieces.forEach((p) => m.set(p.pieceId, p));
    return m;
  }, [placedPieces]);

  if (gridSize === 0) return null;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {layout && (
        <>
          {/* Cells */}
          <View
            ref={gridWrapRef}
            style={[
              styles.gridWrap,
              {
                left: layout.localX,
                top: layout.localY,
                width: layout.cellSize * layout.gridSize,
                height: layout.cellSize * layout.gridSize,
              },
            ]}
          >
            {grid.map((row, r) =>
              row.map((_, c) => (
                <View
                  key={`${r}-${c}`}
                  style={[
                    styles.cell,
                    {
                      width: layout.cellSize - 2,
                      height: layout.cellSize - 2,
                      left: c * layout.cellSize + 1,
                      top: r * layout.cellSize + 1,
                      backgroundColor: highlightSet.has(`${r},${c}`)
                        ? colors.validHighlight
                        : colors.cellEmpty,
                      ...(highlightSet.has(`${r},${c}`) && {
                        borderWidth: 2,
                        borderColor: colors.validHighlightBorder,
                      }),
                    },
                  ]}
                />
              ))
            )}
          </View>
          {/* Placed pieces (locked) */}
          {placedPlacements.map((pl) => {
            const piece = pieceByPieceId.get(pl.pieceId);
            if (!piece) return null;
            const color = (colors as Record<string, string>)[piece.colorKey] ?? colors.cellFilled;
            return (
              <View
                key={pl.pieceId}
                style={[
                  styles.pieceWrap,
                  {
                    left: layout.localX + pl.topLeft.c * layout.cellSize,
                    top: layout.localY + pl.topLeft.r * layout.cellSize,
                  },
                ]}
                pointerEvents="none"
              >
                {piece.cells.map((row, r) =>
                  row.map((cell, c) =>
                    cell === 1 ? (
                      <View
                        key={`${r}-${c}`}
                        style={[
                          styles.block,
                          {
                            width: layout.cellSize - 4,
                            height: layout.cellSize - 4,
                            left: c * layout.cellSize + 2,
                            top: r * layout.cellSize + 2,
                            backgroundColor: color,
                          },
                        ]}
                      />
                    ) : null
                  )
                )}
              </View>
            );
          })}
          {/* Completion ripple: one animated block per filled cell, staggered by index */}
          {showCompletionRipple &&
            layout &&
            filledCells.map(({ r, c }, i) => (
              <RippleBlock
                key={`${r}-${c}`}
                cellIndex={i}
                totalCells={filledCells.length}
                rippleProgress={rippleProgress}
                left={layout.localX + c * layout.cellSize + 2}
                top={layout.localY + r * layout.cellSize + 2}
                size={layout.cellSize - 4}
              />
            ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 200,
  },
  gridWrap: {
    position: "absolute",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gridLine,
    overflow: "hidden",
  },
  rippleBlock: {
    position: "absolute",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  cell: {
    position: "absolute",
    borderRadius: borderRadius.sm,
  },
  pieceWrap: {
    position: "absolute",
    pointerEvents: "none",
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

export type { GridLayout };
