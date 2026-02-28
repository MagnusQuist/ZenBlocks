/**
 * Neon Night game header:
 * - Back button (home)
 * - Level pill centered
 * - Right-side placeholder for future streak
 */

import React, { useLayoutEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { spacing, typography, colors, borderRadius } from "../theme";
import { StreakBadge } from "./StreakBadge";

type LevelHeaderProps = {
  levelNumber: number;
  showBack?: boolean;
  /** Streak count (consecutive levels without undo). Shown with fire icon when >= 3. */
  streak?: number;
};

export function LevelHeader({ levelNumber, showBack = true, streak = 0 }: LevelHeaderProps) {
  const router = useRouter();
  const [isPoofing, setIsPoofing] = useState(false);
  const [poofStreak, setPoofStreak] = useState(0);
  const prevStreakRef = useRef(0);

  const isLosingStreak = streak < 3 && prevStreakRef.current >= 3;
  const showStreak = streak >= 3 || isPoofing || isLosingStreak;
  const showPoofOut = isPoofing || isLosingStreak;
  const displayStreakValue = isPoofing ? poofStreak : isLosingStreak ? prevStreakRef.current : streak;
  /** True when user just reached streak (e.g. completed 3rd level without undo). */
  const animateFlame = streak >= 3 && prevStreakRef.current < 3;

  useLayoutEffect(() => {
    if (streak < 3 && prevStreakRef.current >= 3) {
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
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 54,
  },
  left: { width: 54, alignItems: "flex-start" },
  right: { width: 54, alignItems: "flex-end" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

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
});