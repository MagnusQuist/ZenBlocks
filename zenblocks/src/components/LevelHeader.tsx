/**
 * Neon Night game header:
 * - Back button (home)
 * - Level pill centered
 * - Right-side placeholder for future streak
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { spacing, typography, colors, borderRadius } from "../theme";

type LevelHeaderProps = {
  levelNumber: number;
  showBack?: boolean;
};

export function LevelHeader({ levelNumber, showBack = true }: LevelHeaderProps) {
  const router = useRouter();

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
        {/* reserved for streak / progress later */}
        <View style={styles.iconBtnGhost} />
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
  center: { flex: 1, alignItems: "center" },

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