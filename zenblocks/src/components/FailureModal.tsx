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
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    ...typography.button,
    color: colors.text,
  },
});
