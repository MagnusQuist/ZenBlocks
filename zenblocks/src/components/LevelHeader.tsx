/**
 * Game screen header: optional back + Level N
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { spacing, typography, colors } from "../theme";

type LevelHeaderProps = {
  levelNumber: number;
  showBack?: boolean;
};

export function LevelHeader({ levelNumber, showBack = true }: LevelHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    } catch {
      router.replace("/");
    }
  };

  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backText}>⌂</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backBtn} />
      )}
      <Text style={styles.title}>Level {levelNumber}</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  backBtn: {
    minWidth: 44,
    alignItems: "flex-start",
  },
  backText: {
    fontSize: 24,
    color: colors.primary,
  },
  title: {
    ...typography.header,
    color: colors.primary,
  },
});
