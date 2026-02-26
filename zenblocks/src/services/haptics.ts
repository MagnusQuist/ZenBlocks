/**
 * Haptics feedback. Respects settings (caller checks hapticsEnabled).
 */

import * as Haptics from "expo-haptics";

export function impactLight(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function impactMedium(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function notificationTick(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
