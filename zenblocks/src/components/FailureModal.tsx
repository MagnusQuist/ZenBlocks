/**
 * Failure modal: "No moves left" + Retry Level, Skip Level (Watch Ad)
 */

import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, borderRadius, typography } from "../theme";

type FailureModalProps = {
  visible: boolean;
  onRetry: () => void;
  onSkipWatchAd: () => void;
};

export function FailureModal({
  visible,
  onRetry,
  onSkipWatchAd,
}: FailureModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>No moves left</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.primaryBtn} onPress={onRetry}>
              <Text style={styles.primaryBtnText}>Retry Level</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onSkipWatchAd}>
              <Text style={styles.secondaryBtnText}>Skip Level (Watch Ad)</Text>
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
    ...typography.button,
    color: colors.primary,
  },
});
