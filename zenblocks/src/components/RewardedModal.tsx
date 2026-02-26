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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 320,
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  primaryBtnText: {
    ...typography.button,
    color: "#FFF",
  },
  secondaryBtn: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  secondaryBtnText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
