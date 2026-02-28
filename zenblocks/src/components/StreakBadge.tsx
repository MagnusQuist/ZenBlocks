/**
 * Streak badge with flame icon and count.
 * Plays a flame burst when the streak starts or increases; plays a "poof" smoke animation when the streak is lost.
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, borderRadius } from "../theme";

const FLAME_DURATION_MS = 700;
const POOF_DURATION_MS = 650;
const PARTICLE_COUNT = 8;
const POOF_PARTICLE_COUNT = 10;
const BURST_RADIUS = 24;
const PARTICLE_SIZE = 12;
const POOF_RISE = 32;
const POOF_SPREAD = 20;

const FLAME_COLORS = [colors.rose, colors.coral, colors.peach];
const SMOKE_COLORS = ["rgba(180,180,200,0.5)", "rgba(140,140,160,0.45)", "rgba(200,200,220,0.4)"];

type StreakBadgeProps = {
  streak: number;
  /** Optional variant for slightly different sizing (e.g. welcome vs header). */
  variant?: "default" | "compact";
  /** When true, play flame burst (e.g. when streak just reached 3 or increased). Set by parent. */
  animateFlame?: boolean;
  /** When true, play poof-out animation then call onPoofComplete. Badge shows with displayStreak. */
  poofOut?: boolean;
  /** Streak value to display when poofOut (last known streak). */
  displayStreak?: number;
  /** Called when poof animation finishes. */
  onPoofComplete?: () => void;
};

export function StreakBadge({
  streak,
  variant = "default",
  animateFlame = false,
  poofOut = false,
  displayStreak,
  onPoofComplete,
}: StreakBadgeProps) {
  const progress = useSharedValue(0);
  const poofProgress = useSharedValue(0);
  const prevStreakRef = useRef<number | null>(null);

  const showValue = poofOut ? (displayStreak ?? streak) : streak;
  const isCompact = variant === "compact";

  // Flame burst when parent says "just reached streak" (animateFlame) or when streak increases
  useEffect(() => {
    if (poofOut) return;
    const prev = prevStreakRef.current;
    const parentTriggeredFlame = animateFlame;
    const streakIncreased = prev !== null && prev >= 3 && streak > prev;
    const shouldAnimate = (streak >= 3 && parentTriggeredFlame) || streakIncreased;

    prevStreakRef.current = streak;

    if (shouldAnimate) {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: FLAME_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [streak, animateFlame, poofOut, progress]);

  // Poof-out when poofOut becomes true
  useEffect(() => {
    if (!poofOut || !onPoofComplete) return;
    poofProgress.value = 0;
    poofProgress.value = withTiming(
      1,
      {
        duration: POOF_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished) runOnJS(onPoofComplete)();
      }
    );
  }, [poofOut, onPoofComplete, poofProgress]);

  const pillAnimatedStyle = useAnimatedStyle(() => {
    "worklet";
    if (!poofOut) return { opacity: 1, transform: [{ scale: 1 }] };
    const p = poofProgress.value;
    return {
      opacity: 1 - p * 0.9,
      transform: [{ scale: 1 - p * 0.3 }],
    };
  });

  return (
    <View style={[styles.wrap, isCompact && styles.wrapCompact]}>
      <Animated.View style={[styles.pill, isCompact && styles.pillCompact, pillAnimatedStyle]}>
        <Ionicons name="flame" size={14} color={colors.rose} />
        <Text style={[styles.text, isCompact && styles.textCompact]}>{showValue}</Text>
      </Animated.View>

      {!poofOut && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <FlameParticle key={i} index={i} progress={progress} />
          ))}
        </View>
      )}

      {poofOut && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: POOF_PARTICLE_COUNT }).map((_, i) => (
            <PoofParticle key={i} index={i} progress={poofProgress} />
          ))}
        </View>
      )}
    </View>
  );
}

function FlameParticle({
  index,
  progress,
}: {
  index: number;
  progress: Animated.SharedValue<number>;
}) {
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2 - Math.PI / 2;
  const color = FLAME_COLORS[index % FLAME_COLORS.length];

  const style = useAnimatedStyle(() => {
    "worklet";
    const p = progress.value;
    const dist = p * BURST_RADIUS;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    const scale = 0.4 + p * 1.1;
    const opacity = Math.max(0, (1 - p) * 0.95);
    return {
      position: "absolute" as const,
      left: "50%",
      top: "50%",
      width: PARTICLE_SIZE,
      height: PARTICLE_SIZE,
      marginLeft: -PARTICLE_SIZE / 2,
      marginTop: -PARTICLE_SIZE / 2,
      borderRadius: PARTICLE_SIZE / 2,
      backgroundColor: color,
      opacity,
      transform: [{ translateX: x }, { translateY: y }, { scale }],
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 6,
    };
  });

  return <Animated.View style={style} />;
}

function PoofParticle({
  index,
  progress,
}: {
  index: number;
  progress: Animated.SharedValue<number>;
}) {
  const angle = (index / POOF_PARTICLE_COUNT) * Math.PI * 2 + index * 0.3;
  const spreadX = Math.cos(angle) * POOF_SPREAD;
  const color = SMOKE_COLORS[index % SMOKE_COLORS.length];
  const size = 8 + (index % 4);
  const delay = index * 0.04;

  const style = useAnimatedStyle(() => {
    "worklet";
    const p = Math.max(0, (progress.value - delay) / (1 - delay));
    const y = -p * POOF_RISE;
    const x = p * spreadX;
    const scale = 0.6 + p * 1.2;
    const opacity = Math.max(0, (1 - p) * 0.7);
    return {
      position: "absolute" as const,
      left: "50%",
      top: "50%",
      width: size,
      height: size,
      marginLeft: -size / 2,
      marginTop: -size / 2,
      borderRadius: size / 2,
      backgroundColor: color,
      opacity,
      transform: [{ translateX: x }, { translateY: y }, { scale }],
    };
  });

  return <Animated.View style={style} />;
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    alignSelf: "flex-start",
  },
  wrapCompact: {},
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  pillCompact: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  text: {
    ...typography.header,
    color: colors.text,
    letterSpacing: 0.2,
    textShadowColor: colors.rose,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  textCompact: {
    ...typography.caption,
    textShadowRadius: 6,
  },
});
