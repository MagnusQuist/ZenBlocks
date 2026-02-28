/**
 * Welcome screen: title "Zen Blocks", Play button, Settings icon.
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography, borderRadius } from "../theme";
import { useGameStore } from "../state/gameStore";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentLevel = useGameStore((s) => s.currentLevelNumber);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
          paddingLeft: insets.left + spacing.lg,
          paddingRight: insets.right + spacing.lg,
        },
      ]}
    >
      <Text style={styles.title}>Zen Blocks</Text>
      <TouchableOpacity
        style={styles.playBtn}
        onPress={() => router.push("/game")}
        activeOpacity={0.8}
      >
        <Text style={styles.playBtnText}>Let's Play!</Text>
      </TouchableOpacity>
      <Text style={styles.levelText}>Level {currentLevel}/255</Text>
      <TouchableOpacity
        style={[styles.settingsBtn, { top: insets.top + spacing.sm }]}
        onPress={() => router.push("/settings")}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.settingsIcon}>⚙</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...typography.display,
    color: colors.primary,
    marginBottom: spacing.xl,
    textShadowColor: "rgba(107, 76, 158, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  playBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl * 2,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  playBtnText: {
    ...typography.button,
    color: "#FFF",
  },
  levelText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  settingsBtn: {
    position: "absolute",
    right: spacing.lg,
    padding: spacing.sm,
  },
  settingsIcon: {
    fontSize: 26,
    color: colors.primary,
  },
});
