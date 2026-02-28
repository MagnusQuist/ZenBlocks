/**
 * Neon Night game header:
 * - Back button (home)
 * - Level pill centered, score and streak mult under it
 * - Right: streak badge
 */

import React, { useLayoutEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { spacing, typography, colors, borderRadius } from "../theme";
import { StreakBadge } from "./StreakBadge";
import { useGameStore } from "../state/gameStore";
import { getStreakMultiplier } from "../game/scoring";
import { getTitleById } from "../data/titleUnlocks";
import type { TitleMilestoneId } from "../data/titleUnlocks";

type LevelHeaderProps = {
  levelNumber: number;
  showBack?: boolean;
  /** Streak count (consecutive levels without undo). Shown with fire icon when >= 2. */
  streak?: number;
};

/** Select primitives separately so Zustand doesn't see a new object reference every render. */
export function LevelHeader({ levelNumber, showBack = true, streak = 0 }: LevelHeaderProps) {
  const totalScore = useGameStore((s) => s.totalScore);
  const selectedTitleId = useGameStore((s) => s.selectedTitleId);
  const selectedTitle = getTitleById(selectedTitleId as TitleMilestoneId | null);
  const consecutiveNoUndoCompletions = useGameStore((s) => s.consecutiveNoUndoCompletions);
  const streakActive = consecutiveNoUndoCompletions >= 2;
  const streakMultiplier = getStreakMultiplier(streakActive, consecutiveNoUndoCompletions);
  const router = useRouter();
  const [isPoofing, setIsPoofing] = useState(false);
  const [poofStreak, setPoofStreak] = useState(0);
  const prevStreakRef = useRef(0);

  const isLosingStreak = streak < 2 && prevStreakRef.current >= 2;
  const showStreak = streak >= 2 || isPoofing || isLosingStreak;
  const showPoofOut = isPoofing || isLosingStreak;
  const displayStreakValue = isPoofing ? poofStreak : isLosingStreak ? prevStreakRef.current : streak;
  /** True when user just reached streak (e.g. completed 2nd level without undo). */
  const animateFlame = streak >= 2 && prevStreakRef.current < 2;

  useLayoutEffect(() => {
    if (streak < 2 && prevStreakRef.current >= 2) {
      setPoofStreak(prevStreakRef.current);
      setIsPoofing(true);
    }
    prevStreakRef.current = streak;
  }, [streak]);

  const handleBack = () => {
    try {
      if (router.canGoBack()) router.back();
      else router.replace("/");
    } catch {
      router.replace("/");
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.left}>
          {showBack ? (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.iconBtn}
              activeOpacity={0.85}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="home" size={18} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconBtnGhost} />
          )}
        </View>

        <View style={styles.center}>
          <View style={styles.levelPill}>
            <Ionicons name="sparkles" size={14} color={colors.accent} />
            <Text style={styles.levelText}>Level {levelNumber}</Text>
          </View>
        </View>

        <View style={styles.right}>
          {showStreak ? (
            <StreakBadge
              streak={streak}
              animateFlame={animateFlame}
              poofOut={showPoofOut}
              displayStreak={displayStreakValue}
              onPoofComplete={() => {
                setIsPoofing(false);
                prevStreakRef.current = 0;
              }}
            />
          ) : (
            <View style={styles.iconBtnGhost} />
          )}
        </View>
      </View>

      <View style={styles.scoreRow}>
        {totalScore > 0 && <Text style={styles.scoreText}>{totalScore.toLocaleString()}</Text>}
        {streakActive && streakMultiplier > 1 && (
          <View style={styles.streakMultBadge}>
            <Text style={styles.streakMultText}>×{streakMultiplier.toFixed(1)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 54,
  },
  left: { width: 54, alignItems: "flex-start" },
  right: { width: 54, alignItems: "flex-end" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  titleLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    maxWidth: 120,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  iconBtnGhost: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    opacity: 0,
  },

  levelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  levelText: {
    ...typography.header,
    color: colors.text,
    letterSpacing: 0.2,
    textShadowColor: colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: spacing.sm,
  },
  scoreText: {
    ...typography.body,
    fontSize: 16,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  streakMultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    backgroundColor: "rgba(255,46,234,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,46,234,0.4)",
  },
  streakMultText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.rose,
  },
});