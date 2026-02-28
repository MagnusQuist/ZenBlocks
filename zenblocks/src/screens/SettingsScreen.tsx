/**
 * Settings screen: sound toggle, haptics toggle, placeholder Privacy/Restore.
 */

import React from "react";
import { View, Text, Switch, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGameStore } from "../state/gameStore";
import { colors, spacing, typography, borderRadius } from "../theme";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const soundEnabled = useGameStore((s) => s.settings.soundEnabled);
  const hapticsEnabled = useGameStore((s) => s.settings.hapticsEnabled);
  const setSoundEnabled = useGameStore((s) => s.setSoundEnabled);
  const setHapticsEnabled = useGameStore((s) => s.setHapticsEnabled);

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
      <View style={styles.section}>
        <Text style={styles.label}>Sound</Text>
        <Switch
          value={soundEnabled}
          onValueChange={setSoundEnabled}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Haptics</Text>
        <Switch
          value={hapticsEnabled}
          onValueChange={setHapticsEnabled}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>
      <TouchableOpacity style={styles.placeholderBtn}>
        <Text style={styles.placeholderText}>Privacy</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.placeholderBtn}>
        <Text style={styles.placeholderText}>Restore</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md + 4,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  label: {
    ...typography.body,
    color: colors.text,
  },
  placeholderBtn: {
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  placeholderText: {
    ...typography.body,
    color: colors.textMuted,
  },
  backBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
    backgroundColor: colors.primary,
  },
  backText: {
    ...typography.button,
    color: "#FFF",
  },
});
