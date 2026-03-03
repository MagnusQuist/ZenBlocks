/**
 * Tray of remaining pieces.
 * Horizontal scroll; padding so users can start scroll from empty space.
 * Uses RNGH ScrollView so piece drag (vertical intent) can take over without fighting scroll.
 * Optional scroll hint when content is scrollable and many pieces.
 */

import React, { useCallback, useRef, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import type { Piece } from "../game/levelGenerator";
import { colors, spacing, typography, borderRadius } from "../theme";

const TRAY_CELL_SIZE = 26;
const TRAY_GAP = 4;

export const TRAY_HIT_SLOP = 14;

/** Horizontal padding so users can start scroll from empty space (not on a piece). */
export const TRAY_HORIZONTAL_PADDING = spacing.lg;

/** Scroll offset past which we consider the user "having scrolled" (dismiss hint). */
const SCROLL_DISMISS_THRESHOLD = 20;

export type FirstPieceLayout = { x: number; y: number; width: number; height: number };

type PieceTrayProps = {
  pieces: Piece[];
  onPieceLayout?: (pieceId: string, x: number, y: number, width: number, height: number) => void;
  /** Called with first piece slot bounds (window coords) when layout is available. */
  onFirstPieceLayout?: (layout: FirstPieceLayout) => void;
  renderPiece: (piece: Piece) => React.ReactNode;
  /** Show "swipe for more" hint when tray is scrollable. Caller controls when to offer (e.g. level 2). */
  showScrollHint?: boolean;
  /** Called when user scrolls so caller can mark hint as seen. */
  onScrollHintDismiss?: () => void;
};

export function PieceTray({
  pieces,
  onPieceLayout,
  onFirstPieceLayout,
  renderPiece,
  showScrollHint = false,
  onScrollHintDismiss,
}: PieceTrayProps) {
  const [contentWidth, setContentWidth] = useState(0);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const scrollHintDismissedRef = useRef(false);
  const scrollOffsetX = useSharedValue(0);

  const isScrollable = contentWidth > layoutWidth && layoutWidth > 0;
  const showHint = showScrollHint && isScrollable && !scrollHintDismissedRef.current;

  const onContentSizeChange = useCallback((w: number) => {
    setContentWidth(w);
  }, []);

  const onScrollViewLayout = useCallback((e: { nativeEvent: { layout: { width: number } } }) => {
    setLayoutWidth(e.nativeEvent.layout.width);
  }, []);

  const onScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const x = e.nativeEvent.contentOffset.x;
      scrollOffsetX.value = x;
      if (x > SCROLL_DISMISS_THRESHOLD && !scrollHintDismissedRef.current && onScrollHintDismiss) {
        scrollHintDismissedRef.current = true;
        onScrollHintDismiss();
      }
    },
    [onScrollHintDismiss]
  );

  return (
    <View style={styles.container} onLayout={onScrollViewLayout}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        onContentSizeChange={(w) => onContentSizeChange(w)}
        onScroll={onScroll}
        scrollEventThrottle={32}
      >
        {pieces.map((piece, index) => (
          <PieceSlot
            key={piece.pieceId}
            piece={piece}
            isFirst={index === 0}
            onLayout={onPieceLayout}
            onFirstPieceLayout={onFirstPieceLayout}
            slotWidth={piece.width * TRAY_CELL_SIZE + TRAY_HIT_SLOP * 2}
            slotHeight={piece.height * TRAY_CELL_SIZE + TRAY_HIT_SLOP * 2}
          >
            {renderPiece(piece)}
          </PieceSlot>
        ))}
      </ScrollView>
      {showHint ? (
        <View style={styles.scrollHintOverlay} pointerEvents="none">
          <ScrollHintPill />
        </View>
      ) : null}
    </View>
  );
}

function ScrollHintPill() {
  const translateX = useSharedValue(0);
  React.useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.scrollHintWrap, animatedStyle]}>
      <Text style={styles.scrollHintText}>Swipe for more</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.accent} />
    </Animated.View>
  );
}

function PieceSlot({
  piece,
  isFirst,
  onLayout,
  onFirstPieceLayout,
  slotWidth,
  slotHeight,
  children,
}: {
  piece: Piece;
  isFirst: boolean;
  onLayout?: (pieceId: string, x: number, y: number, w: number, h: number) => void;
  onFirstPieceLayout?: (layout: FirstPieceLayout) => void;
  slotWidth: number;
  slotHeight: number;
  children: React.ReactNode;
}) {
  const ref = React.useRef<View>(null);

  const onSlotLayout = React.useCallback(() => {
    ref.current?.measureInWindow((x, y, width, height) => {
      onLayout?.(piece.pieceId, x, y, width, height);
      if (isFirst && onFirstPieceLayout) {
        onFirstPieceLayout({ x, y, width, height });
      }
    });
  }, [piece.pieceId, isFirst, onLayout, onFirstPieceLayout]);

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
    paddingHorizontal: TRAY_HORIZONTAL_PADDING,
    paddingVertical: spacing.xs,
  },
  pieceSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  scrollHintOverlay: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingRight: spacing.sm,
  },
  scrollHintWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(11, 14, 37, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 212, 0.35)",
  },
  scrollHintText: {
    ...typography.caption,
    color: colors.accent,
    fontSize: 12,
  },
});

export { TRAY_CELL_SIZE };