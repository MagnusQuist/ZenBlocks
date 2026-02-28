/**
 * Rewarded ad placeholder modal: "Watch ad to undo" or skip.
 */

import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, borderRadius, typography } from "../theme";

type RewardedModalProps = {
  visible: boolean;
  purpose: "undo" | "skip" | null;
  onWatch: () => void;
  onDismiss: () => void;
};

export function RewardedModal({ visible, purpose, onWatch, onDismiss }: RewardedModalProps) {
  if (!purpose) return null;

  const title = purpose === "undo" ? "Watch ad to undo" : "Watch ad to skip level";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.primaryBtn} onPress={onWatch}>
              <Text style={styles.primaryBtnText}>Watch Ad</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onDismiss}>
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(26, 21, 32, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 320,
    borderWidth: 2,
    borderColor: colors.drawerBorder,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    ...typography.header,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  buttons: {
    gap: spacing.sm,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryBtnText: {
    ...typography.button,
    color: "#FFF",
  },
  secondaryBtn: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryBtnText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "600",
  },
});
