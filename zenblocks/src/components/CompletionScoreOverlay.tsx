/**
 * Level completion overlay: celebrates and shows score breakdown.
 * "+{finalScore}" count-up (~500ms), then breakdown lines fade in one after the other.
 */

import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import type { CompletionOverlayData } from "../state/gameStore";
import { colors, spacing, typography, borderRadius } from "../theme";

const COUNT_UP_MS = 500;
const TICK_MS = 16;
const FADE_DURATION = 280;
const FADE_STAGGER_MS = 70;

type Props = {
  visible: boolean;
  data: CompletionOverlayData | null;
  onDismiss: () => void;
};

export function CompletionScoreOverlay({ visible, data, onDismiss }: Props) {
  const [displayEarned, setDisplayEarned] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const earnedOpacity = useSharedValue(0);
  const earnedRowStyle = useAnimatedStyle(() => ({ opacity: earnedOpacity.value }));

  useEffect(() => {
    if (!visible || !data) return;
    setShowBreakdown(false);
    earnedOpacity.value = 0;
    earnedOpacity.value = withTiming(1, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
    const target = data.finalLevelScore;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / COUNT_UP_MS);
      const eased = 1 - Math.pow(1 - t, 2);
      setDisplayEarned(Math.round(target * eased));
      if (t >= 1) {
        clearInterval(timer);
        setDisplayEarned(target);
        setShowBreakdown(true);
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [visible, data]);

  if (!visible || !data) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.backdrop} />
      <View style={styles.card}>
        {data.nextStreak >= 2 && (
          <FadeInRow delayMs={0}>
            <View style={styles.streakAbove}>
              <Ionicons name="flame" size={20} color={colors.rose} />
              <Text style={styles.streakAboveText}>{data.nextStreak} in a row</Text>
            </View>
          </FadeInRow>
        )}
        <Text style={styles.title}>Level complete!</Text>

        <Animated.View style={[styles.earnedRow, earnedRowStyle]}>
          <Text style={styles.earnedScore}>+{displayEarned.toLocaleString()}</Text>
        </Animated.View>

        {showBreakdown && (
          <View style={styles.breakdown}>
            <FadeInRow delayMs={0}>
              <Text style={styles.breakdownLine}>BASE {data.baseScore}</Text>
            </FadeInRow>
            {data.cleanMultiplier > 1 && (
              <FadeInRow delayMs={FADE_STAGGER_MS * 1}>
                <Text style={styles.breakdownLineClean}>CLEAN ×{data.cleanMultiplier.toFixed(2)}</Text>
              </FadeInRow>
            )}
            {data.streakMultiplier > 1 && (
              <FadeInRow delayMs={FADE_STAGGER_MS * 2}>
                <Text style={styles.breakdownLineStreak}>STREAK ×{data.streakMultiplier.toFixed(1)}</Text>
              </FadeInRow>
            )}
            <FadeInRow delayMs={FADE_STAGGER_MS * 3}>
              <View style={styles.divider} />
            </FadeInRow>
            <FadeInRow delayMs={FADE_STAGGER_MS * 4}>
              <Text style={styles.totalLine}>TOTAL {data.totalScore.toLocaleString()}</Text>
            </FadeInRow>
          </View>
        )}

        <TouchableOpacity
          style={styles.continueBtn}
          onPress={onDismiss}
          activeOpacity={0.9}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,8,20,0.92)",
  },
  card: {
    backgroundColor: "rgba(18, 22, 58, 0.95)",
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    minWidth: 280,
    maxWidth: 320,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.md,
    textShadowColor: colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  earnedRow: {
    marginBottom: spacing.lg,
  },
  earnedScore: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: 0.5,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  breakdown: {
    alignSelf: "stretch",
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: borderRadius.md,
  },
  breakdownLine: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  breakdownLineClean: {
    ...typography.caption,
    color: colors.mint,
    fontWeight: "700",
    marginBottom: 2,
    textShadowColor: "rgba(0, 245, 212, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  breakdownLineStreak: {
    ...typography.caption,
    color: colors.rose,
    fontWeight: "700",
    marginBottom: 2,
    textShadowColor: "rgba(255, 46, 234, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  streakAbove: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: spacing.sm,
  },
  streakAboveText: {
    ...typography.caption,
    fontSize: 15,
    fontWeight: "700",
    color: colors.rose,
    letterSpacing: 0.3,
    textShadowColor: "rgba(255, 46, 234, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: spacing.sm,
  },
  totalLine: {
    ...typography.caption,
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.4,
    textShadowColor: colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  continueBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  continueBtnText: {
    ...typography.button,
    color: "#081023",
  },
});

function FadeInRow({
  delayMs,
  children,
  style,
}: {
  delayMs: number;
  children: React.ReactNode;
  style?: object;
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delayMs,
      withTiming(1, {
        duration: FADE_DURATION,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [delayMs, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
