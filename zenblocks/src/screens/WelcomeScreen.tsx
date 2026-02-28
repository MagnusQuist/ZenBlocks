/**
 * Neon Night Welcome screen:
 * - Big title with neon glow
 * - Subtitle
 * - Static mini board preview
 * - Floating background pieces (slow)
 * - Play button
 * - Settings icon (Ionicons)
 * - Current level text
 */

import React, { useMemo, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, borderRadius } from "../theme";
import { useGameStore } from "../state/gameStore";
import { getTitleById, getFirstUnlockScore } from "../data/titleUnlocks";
import type { TitleMilestoneId } from "../data/titleUnlocks";
import { StreakBadge } from "../components/StreakBadge";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type FloatingPieceSpec = {
  id: string;
  x: number;
  y: number;
  size: number;
  rot: number;
  color: string;
  opacity: number;
  speed: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function FloatingPiece({ spec }: { spec: FloatingPieceSpec }) {
  const drift = useSharedValue(0);

  React.useEffect(() => {
    // slow sine-like drift via repeated timing
    drift.value = withRepeat(
      withTiming(1, {
        duration: spec.speed,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
  }, [drift, spec.speed]);

  const style = useAnimatedStyle(() => {
    const t = drift.value; // 0..1..0..1
    const dy = (t - 0.5) * 28; // gentle vertical drift
    const dx = (t - 0.5) * 18; // gentle horizontal drift
    const r = spec.rot + (t - 0.5) * 6; // tiny rotation wiggle
    return {
      transform: [
        { translateX: dx },
        { translateY: dy },
        { rotate: `${r}deg` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.floatPiece,
        {
          left: spec.x,
          top: spec.y,
          width: spec.size,
          height: spec.size,
          backgroundColor: spec.color,
          opacity: spec.opacity,
          shadowColor: spec.color,
        },
        style,
      ]}
    />
  );
}

function FloatingBackground() {
  const specs = useMemo<FloatingPieceSpec[]>(() => {
    // deterministic-ish layout for stability (not random each render)
    const palette = [
      colors.accent,
      colors.primary,
      colors.sky,
      colors.rose,
      colors.mint,
      colors.lavender,
      colors.peach,
    ];

    const pieces: FloatingPieceSpec[] = [];
    const count = 10;

    for (let i = 0; i < count; i++) {
      const size = 38 + (i % 4) * 10;
      const x = clamp((SCREEN_W * (0.06 + (i * 0.085))) % (SCREEN_W - 60), 12, SCREEN_W - 60);
      const y = clamp((SCREEN_H * (0.10 + (i * 0.11))) % (SCREEN_H - 140), 40, SCREEN_H - 140);
      const rot = -18 + (i * 7) % 36;
      const color = palette[i % palette.length];
      const opacity = 0.14 + (i % 3) * 0.06;
      const speed = 5200 + (i % 5) * 1100;

      pieces.push({
        id: `fp_${i}`,
        x,
        y,
        size,
        rot,
        color,
        opacity,
        speed,
      });
    }
    return pieces;
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {specs.map((s) => (
        <FloatingPiece key={s.id} spec={s} />
      ))}
    </View>
  );
}

function MiniBoardPreview() {
  // Static preview board (4x4) with a pleasing filled pattern.
  // This is purely visual; no gameplay logic.
  const size = 4;
  const cell = 22;
  const gap = 6;

  // Simple “almost-filled” pattern for illustration
  const filled = new Set<string>([
    "0,0", "0,1", "0,2",
    "1,0", "1,1",
    "2,1", "2,2", "2,3",
    "3,2", "3,3",
  ]);

  return (
    <View style={styles.previewCard}>
      <View style={[styles.previewGrid, { width: size * cell + (size - 1) * gap, height: size * cell + (size - 1) * gap }]}>
        {Array.from({ length: size }).map((_, r) =>
          Array.from({ length: size }).map((__, c) => {
            const isFilled = filled.has(`${r},${c}`);
            return (
              <View
                key={`${r}-${c}`}
                style={[
                  styles.previewCell,
                  {
                    width: cell,
                    height: cell,
                    left: c * (cell + gap),
                    top: r * (cell + gap),
                    backgroundColor: isFilled ? "rgba(139,92,246,0.55)" : colors.cellEmpty,
                    borderColor: isFilled ? "rgba(0,245,212,0.35)" : "rgba(255,255,255,0.08)",
                  },
                ]}
              />
            );
          })
        )}
      </View>

      {/* A couple “tray pieces” to show the concept */}
      <View style={styles.previewPiecesRow}>
        <View style={[styles.previewPiece, { backgroundColor: colors.accent, shadowColor: colors.accent }]} />
        <View style={[styles.previewPieceTall, { backgroundColor: colors.rose, shadowColor: colors.rose }]} />
        <View style={[styles.previewPieceWide, { backgroundColor: colors.sky, shadowColor: colors.sky }]} />
      </View>
    </View>
  );
}

const SCORE_PULSE_DURATION = 2400;

function AnimatedScoreValue({ score, insetsBottom }: { score: number; insetsBottom: number }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, {
        duration: SCORE_PULSE_DURATION / 2,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => {
    const t = pulse.value;
    return {
      opacity: 0.88 + 0.12 * t,
      transform: [{ scale: 1 + 0.05 * t }],
    };
  });

  return (
    <View
      style={[
        styles.scoreFooter,
        { paddingBottom: insetsBottom + spacing.md },
      ]}
    >
      <Text style={styles.scoreFooterLabel}>Score</Text>
      <Animated.View style={animatedStyle}>
        <Text style={styles.scoreFooterValue}>{score.toLocaleString()}</Text>
      </Animated.View>
    </View>
  );
}

const TITLE_FLARE_DURATION = 2000;

function AnimatedTitleFlare({ title }: { title: string }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, {
        duration: TITLE_FLARE_DURATION / 2,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => {
    const t = pulse.value;
    return {
      opacity: 0.92 + 0.08 * t,
      transform: [{ scale: 1 + 0.03 * t }],
    };
  });

  return (
    <Animated.View style={[styles.topBarTitleFlareWrap, animatedStyle]}>
      <Text style={styles.topBarTitleFlareText} numberOfLines={1}>
        {title}
      </Text>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentLevel = useGameStore((s) => s.currentLevelNumber);
  const totalScore = useGameStore((s) => s.totalScore);
  const selectedTitleId = useGameStore((s) => s.selectedTitleId);
  const selectedTitle = getTitleById(selectedTitleId as TitleMilestoneId | null);
  const streak = useGameStore((s) => s.consecutiveNoUndoCompletions);
  const showStreak = streak >= 2;

  return (
    <View style={styles.root}>
      <FloatingBackground />

      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + spacing.md,
            paddingLeft: insets.left + spacing.lg,
            paddingRight: insets.right + spacing.lg,
          },
        ]}
      >
        <View style={styles.topBarLeft}>
          {showStreak ? (
            <StreakBadge streak={streak} variant="compact" staticDisplay />
          ) : (
            <View style={styles.topBarSpacer} />
          )}
        </View>

        <View style={styles.topBarCenter}>
          {selectedTitle ? (
            <AnimatedTitleFlare title={selectedTitle.name} />
          ) : (
            <TouchableOpacity
              style={styles.topBarUnlockHint}
              onPress={() => router.push("/unlocks")}
              activeOpacity={0.85}
            >
              <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
              <Text style={styles.topBarUnlockHintText} numberOfLines={1}>
                Score {getFirstUnlockScore().toLocaleString()} to unlock title
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push("/settings")}
            activeOpacity={0.85}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="settings-sharp" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content */}
      <View
        style={[
          styles.container,
          {
            paddingBottom: insets.bottom + spacing.lg,
            paddingLeft: insets.left + spacing.lg,
            paddingRight: insets.right + spacing.lg,
          },
        ]}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>Neon{"\n"}Blocks</Text>
          <Text style={styles.subtitle}>Fit the blocks. Fill the board</Text>

          <MiniBoardPreview />

          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => router.push("/game")}
            activeOpacity={0.9}
          >
            <View style={styles.playBtnContent}>
              <Text style={styles.playBtnText}>Play</Text>
              <Text style={styles.playBtnLevel}>Level {currentLevel}</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={"#081023"} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.unlocksBtn}
            onPress={() => router.push("/unlocks")}
            activeOpacity={0.85}
          >
            <Ionicons name="trophy" size={22} color={colors.primary} />
            <Text style={styles.unlocksBtnText}>Unlocks</Text>
          </TouchableOpacity>
        </View>

        {totalScore > 0 && (
          <AnimatedScoreValue score={totalScore} insetsBottom={insets.bottom} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
  },

  topBarLeft: {
    width: 54,
    alignItems: "flex-start",
  },
  topBarCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarSpacer: {
    width: 54,
    height: 36,
  },
  topBarRight: {
    width: 54,
    alignItems: "flex-end",
  },
  topBarTitleFlareWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitleFlareText: {
    ...typography.caption,
    fontSize: 16,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: 0.5,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  topBarUnlockHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  topBarUnlockHintText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },

  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  container: {
    flex: 1,
    justifyContent: "center",
  },

  hero: {
    alignItems: "center",
  },

  title: {
    ...typography.display,
    color: colors.text,
    textAlign: "center",
    lineHeight: 46,
    marginBottom: spacing.md,
    // neon glow stack
    textShadowColor: colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },

  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },

  previewCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    //shadowColor: colors.primary,
    //shadowOffset: { width: 0, height: 12 },
    //shadowOpacity: 0.18,
    //shadowRadius: 22,
    elevation: 8,
    marginBottom: spacing.xl,
  },

  previewGrid: {
    position: "relative",
    alignSelf: "center",
    marginBottom: spacing.lg,
  },

  previewCell: {
    position: "absolute",
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },

  previewPiecesRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },

  previewPiece: {
    width: 42,
    height: 28,
    borderRadius: borderRadius.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  previewPieceTall: {
    width: 28,
    height: 42,
    borderRadius: borderRadius.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  previewPieceWide: {
    width: 56,
    height: 22,
    borderRadius: borderRadius.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },

  playBtn: {
    width: "100%",
    maxWidth: 320,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",

    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 10,
  },
  playBtnContent: {
    alignItems: "flex-start",
  },
  playBtnText: {
    ...typography.button,
    color: "#081023",
  },
  playBtnLevel: {
    ...typography.caption,
    fontSize: 12,
    color: "rgba(8,16,35,0.75)",
    marginTop: 2,
  },

  unlocksBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    maxWidth: 320,
    alignSelf: "center",
  },
  unlocksBtnText: {
    ...typography.body,
    color: colors.text,
    letterSpacing: 0.3,
  },

  hintText: {
    ...typography.caption,
    color: "rgba(234,240,255,0.55)",
    marginTop: spacing.md,
  },

  scoreFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  scoreFooterLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  scoreFooterValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.5,
    textShadowColor: colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  floatPiece: {
    position: "absolute",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 4,
  },
});