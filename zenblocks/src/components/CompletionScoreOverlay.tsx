/**
 * Level completion overlay: two-step flow when titles unlock.
 * Step 1: "Title unlocked!" animation + Continue.
 * Step 2: Level complete + score breakdown + x3 + Continue.
 */

import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
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
  onWatchPress?: () => void;
  /** Called when user taps Equip on the title-unlock step; receives the title id to equip. */
  onEquipTitle?: (titleId: string) => void;
};

export function CompletionScoreOverlay({ visible, data, onDismiss, onWatchPress, onEquipTitle }: Props) {
  const [showTitleStepFirst, setShowTitleStepFirst] = useState(true);
  const [displayEarned, setDisplayEarned] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const earnedOpacity = useSharedValue(0);
  const earnedRowStyle = useAnimatedStyle(() => ({ opacity: earnedOpacity.value }));

  const titleUnlockCardScale = useSharedValue(0.92);
  const titleUnlockCardOpacity = useSharedValue(0);
  const titleUnlockOverlineOpacity = useSharedValue(0);
  const titleUnlockNameOpacity = useSharedValue(0);
  const titleUnlockNameScale = useSharedValue(0.92);

  const hasNewTitles = (data?.newlyUnlockedTitles?.length ?? 0) > 0;
  const showTitleUnlockStep = visible && data && hasNewTitles && showTitleStepFirst;

  useEffect(() => {
    if (visible) setShowTitleStepFirst(true);
  }, [visible]);

  useEffect(() => {
    if (!visible || !data || !hasNewTitles) return;
    setShowBreakdown(false);
    setDisplayEarned(0);
    titleUnlockCardScale.value = 0.92;
    titleUnlockCardOpacity.value = 0;
    titleUnlockOverlineOpacity.value = 0;
    titleUnlockNameOpacity.value = 0;
    titleUnlockNameScale.value = 0.92;
    titleUnlockCardOpacity.value = withTiming(1, { duration: 220 });
    titleUnlockCardScale.value = withSpring(1, { damping: 16, stiffness: 140 });
    titleUnlockOverlineOpacity.value = withDelay(180, withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }));
    titleUnlockNameOpacity.value = withDelay(380, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
    titleUnlockNameScale.value = withDelay(380, withSpring(1, { damping: 14, stiffness: 120 }));
  }, [visible, data, hasNewTitles]);

  useEffect(() => {
    if (!visible || !data || showTitleUnlockStep) return;
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
  }, [visible, data, showTitleUnlockStep]);

  const goToScoreStep = () => setShowTitleStepFirst(false);

  const titleUnlockCardStyle = useAnimatedStyle(() => ({
    opacity: titleUnlockCardOpacity.value,
    transform: [{ scale: titleUnlockCardScale.value }],
  }));

  const titleUnlockOverlineStyle = useAnimatedStyle(() => ({
    opacity: titleUnlockOverlineOpacity.value,
  }));

  const titleUnlockNameStyle = useAnimatedStyle(() => ({
    opacity: titleUnlockNameOpacity.value,
    transform: [{ scale: titleUnlockNameScale.value }],
  }));

  if (!visible || !data) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.backdrop} />

      {showTitleUnlockStep ? (
        <Animated.View style={[styles.card, styles.titleUnlockCard, titleUnlockCardStyle]}>
          <Animated.View style={[styles.titleUnlockOverlineWrap, titleUnlockOverlineStyle]}>
            <Ionicons name="sparkles" size={14} color={colors.accent} />
            <Text style={styles.titleUnlockOverline}>
              {data.newlyUnlockedTitles.length === 1 ? "NEW TITLE" : "NEW TITLES"}
            </Text>
          </Animated.View>
          <View style={styles.titleUnlockAccentLine} />
          <Animated.View style={[styles.titleUnlockNameWrap, titleUnlockNameStyle]}>
            {data.newlyUnlockedTitles.map((t) => (
              <Text key={t.id} style={styles.titleUnlockName}>
                {t.name}
              </Text>
            ))}
          </Animated.View>
          {data.newlyUnlockedTitles.length > 0 && (() => {
            const first = data.newlyUnlockedTitles[0];
            return (
              <View style={styles.titleUnlockPerks}>
                <Text style={styles.titleUnlockPerksLabel}>Perks</Text>
                <Text style={styles.titleUnlockPerkRow}>
                  {first.scoreMultiplier.toFixed(2)}× level score
                </Text>
                {first.extraHint != null && first.extraHint > 0 && (
                  <Text style={styles.titleUnlockPerkRow}>+{first.extraHint} hint per level</Text>
                )}
                {first.extraUndo != null && first.extraUndo > 0 && (
                  <Text style={styles.titleUnlockPerkRow}>+{first.extraUndo} undo per level</Text>
                )}
              </View>
            );
          })()}
          <View style={styles.titleUnlockActions}>
            {onEquipTitle && data.newlyUnlockedTitles.length > 0 && (
              <TouchableOpacity
                style={styles.titleUnlockEquipBtn}
                onPress={() => {
                  onEquipTitle(data.newlyUnlockedTitles[0].id);
                  goToScoreStep();
                }}
                activeOpacity={0.88}
              >
                <Text style={styles.titleUnlockEquipBtnText}>Equip title</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.titleUnlockContinueBtn, !onEquipTitle && styles.titleUnlockContinueBtnSolo]}
              onPress={goToScoreStep}
              activeOpacity={0.88}
            >
              <Text style={styles.titleUnlockContinueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      ) : (
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
              {data.titleMultiplier > 1 && (
                <FadeInRow delayMs={FADE_STAGGER_MS * 3}>
                  <Text style={styles.breakdownLineTitle}>TITLE ×{data.titleMultiplier.toFixed(2)}</Text>
                </FadeInRow>
              )}
              <FadeInRow delayMs={FADE_STAGGER_MS * (data.titleMultiplier > 1 ? 4 : 3)}>
                <View style={styles.divider} />
              </FadeInRow>
              <FadeInRow delayMs={FADE_STAGGER_MS * (data.titleMultiplier > 1 ? 5 : 4)}>
                <Text style={styles.totalLine}>TOTAL {data.totalScore.toLocaleString()}</Text>
              </FadeInRow>
            </View>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.watchBtn}
              onPress={onWatchPress}
              activeOpacity={0.9}
              disabled={!onWatchPress}
            >
              <Ionicons name="play-circle" size={18} color={onWatchPress ? "#FFD166" : colors.textMuted} />
              <Text style={[styles.watchBtnText, !onWatchPress && styles.watchBtnTextDisabled]}>
                x3
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={onDismiss}
              activeOpacity={0.9}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  breakdownLineTitle: {
    ...typography.caption,
    color: "#E8B923",
    fontWeight: "700",
    marginBottom: 2,
    textShadowColor: "rgba(232, 185, 35, 0.6)",
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
  titleUnlockCard: {
    paddingVertical: spacing.xl + spacing.md,
    paddingHorizontal: spacing.xl,
    minWidth: 300,
  },
  titleUnlockOverlineWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: spacing.sm,
  },
  titleUnlockOverline: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 2.2,
  },
  titleUnlockAccentLine: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    opacity: 0.7,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  titleUnlockNameWrap: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  titleUnlockName: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: 0.2,
    textAlign: "center",
    marginBottom: spacing.xs,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleUnlockPerks: {
    alignSelf: "stretch",
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: borderRadius.md,
  },
  titleUnlockPerksLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  titleUnlockPerkRow: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  titleUnlockActions: {
    alignSelf: "stretch",
    gap: spacing.md,
  },
  titleUnlockEquipBtn: {
    alignSelf: "stretch",
    backgroundColor: "#E8B923",
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    shadowColor: "#E8B923",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  titleUnlockEquipBtnText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#081023",
    letterSpacing: 0.3,
  },
  titleUnlockContinueBtn: {
    alignSelf: "stretch",
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
  },
  titleUnlockContinueBtnText: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 0.3,
  },
  titleUnlockContinueBtnSolo: {
    backgroundColor: colors.accent,
    borderWidth: 0,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
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
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  watchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,209,102,0.18)",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255,209,102,0.5)",
    shadowColor: "#FFD166",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  watchBtnText: {
    ...typography.button,
    fontSize: 16,
    fontWeight: "800",
    color: "#FFD166",
    letterSpacing: 0.5,
    textShadowColor: "rgba(255,209,102,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  watchBtnTextDisabled: {
    color: colors.textMuted,
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
