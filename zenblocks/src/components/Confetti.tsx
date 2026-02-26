/**
 * Burst confetti particles on level completion. Uses Reanimated for smooth animation.
 */

import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { colors } from "../theme";

const PARTICLE_COUNT = 52;
const DURATION_MS = 2200;
const SPREAD = 280;
const GRAVITY = 0.42;

const CONFETTI_COLORS = [
  colors.coral,
  colors.mint,
  colors.sky,
  colors.lavender,
  colors.peach,
  colors.sage,
  colors.rose,
  colors.sand,
  colors.primary,
  "#F9F5F7",
];

type ParticleConfig = {
  id: number;
  color: string;
  vx: number;
  vy: number;
  rotationSpeed: number;
  sizeW: number;
  sizeH: number;
  delay: number;
};

function makeParticles(): ParticleConfig[] {
  const out: ParticleConfig[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 0.4 + Math.random() * 0.6;
    const size = 6 + Math.floor(Math.random() * 6);
    out.push({
      id: i,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      vx: Math.cos(angle) * speed,
      vy: -0.8 - Math.random() * 0.6,
      rotationSpeed: (Math.random() - 0.5) * 4,
      sizeW: size,
      sizeH: Math.random() > 0.5 ? size * 1.4 : size * 0.7,
      delay: Math.random() * 0.15,
    });
  }
  return out;
}

function Particle({
  config,
  progress,
  centerX,
  centerY,
}: {
  config: ParticleConfig;
  progress: Animated.SharedValue<number>;
  centerX: number;
  centerY: number;
}) {
  const style = useAnimatedStyle(() => {
    "worklet";
    const p = Math.max(0, (progress.value - config.delay) / (1 - config.delay));
    const x = config.vx * SPREAD * p;
    const y = config.vy * SPREAD * p + GRAVITY * SPREAD * p * p;
    const rotate = p * config.rotationSpeed * 360;
    const opacity = p <= 0.75 ? 1 : (1 - p) / 0.25;
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${rotate}deg` },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          width: config.sizeW,
          height: config.sizeH,
          backgroundColor: config.color,
          marginLeft: -config.sizeW / 2,
          marginTop: -config.sizeH / 2,
          left: centerX,
          top: centerY,
        },
        style,
      ]}
    />
  );
}

type ConfettiProps = {
  visible: boolean;
  /** Callback when the confetti animation has finished (to unmount or hide). */
  onComplete?: () => void;
};

export function Confetti({ visible, onComplete }: ConfettiProps) {
  const progress = useSharedValue(0);
  const { width, height } = Dimensions.get("window");
  const centerX = width / 2;
  const centerY = height * 0.4;

  const particles = useMemo(() => makeParticles(), []);

  useEffect(() => {
    if (!visible) {
      progress.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withTiming(
      1,
      {
        duration: DURATION_MS,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      }
    );
  }, [visible, progress, onComplete]);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {particles.map((config) => (
        <Particle
          key={config.id}
          config={config}
          progress={progress}
          centerX={centerX}
          centerY={centerY}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 200,
  },
  particle: {
    position: "absolute",
    borderRadius: 2,
  },
});
