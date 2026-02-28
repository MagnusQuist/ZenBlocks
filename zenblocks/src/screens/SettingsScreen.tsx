/**
 * Neon Night Settings screen:
 * - Glass cards
 * - Neon toggles
 * - Icon rows
 * - Clean top bar
 */

import React from "react";
import { View, Text, Switch, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../state/gameStore";
import { colors, spacing, typography, borderRadius } from "../theme";

function Row({
  icon,
  label,
  right,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.rowInner}>
      <View style={styles.rowLeft}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color={colors.text} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>

      <View style={styles.rowRight}>
        {right ?? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.row}>{content}</View>;
}

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
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.lg,
          paddingLeft: insets.left + spacing.lg,
          paddingRight: insets.right + spacing.lg,
        },
      ]}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Settings</Text>

        {/* Spacer to balance the back button */}
        <View style={{ width: 40, height: 40 }} />
      </View>

      {/* Settings Cards */}
      <View style={styles.card}>
        <Row
          icon="volume-high"
          label="Sound"
          right={
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{
                false: "rgba(255,255,255,0.12)",
                true: colors.primary,
              }}
              thumbColor={soundEnabled ? colors.accent : "rgba(234,240,255,0.75)"}
              ios_backgroundColor={"rgba(255,255,255,0.12)"}
            />
          }
        />
        <View style={styles.divider} />
        <Row
          icon="sparkles"
          label="Haptics"
          right={
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{
                false: "rgba(255,255,255,0.12)",
                true: colors.primary,
              }}
              thumbColor={hapticsEnabled ? colors.accent : "rgba(234,240,255,0.75)"}
              ios_backgroundColor={"rgba(255,255,255,0.12)"}
            />
          }
        />
      </View>

      <Text style={styles.sectionTitle}>More</Text>

      <View style={styles.card}>
        <Row
          icon="shield-checkmark"
          label="Privacy"
          onPress={() => {
            // placeholder
          }}
        />
        <View style={styles.divider} />
        <Row
          icon="refresh"
          label="Restore"
          onPress={() => {
            // placeholder
          }}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Neon Blocks</Text>
        <Text style={styles.footerMuted}>Neon Night</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  title: {
    ...typography.title,
    color: colors.text,
    textShadowColor: colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },

  sectionTitle: {
    ...typography.caption,
    color: "rgba(234,240,255,0.55)",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  card: {
    borderRadius: borderRadius.xl,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
    //shadowColor: colors.primary,
    //shadowOffset: { width: 0, height: 14 },
    //shadowOpacity: 0.18,
    //shadowRadius: 24,
    elevation: 8,
  },

  row: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },

  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(0,245,212,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,245,212,0.20)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 5,
  },

  rowLabel: {
    ...typography.body,
    color: colors.text,
  },

  rowRight: {
    alignItems: "center",
    justifyContent: "center",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },

  footer: {
    marginTop: "auto",
    alignItems: "center",
    paddingTop: spacing.xl,
  },

  footerText: {
    ...typography.header,
    color: colors.text,
    textShadowColor: colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  footerMuted: {
    ...typography.caption,
    color: "rgba(234,240,255,0.50)",
    marginTop: 4,
  },
});