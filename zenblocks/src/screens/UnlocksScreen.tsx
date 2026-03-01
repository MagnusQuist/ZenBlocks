/**
 * Unlocks screen: view/select titles by score milestones.
 * Neon night style; 2-column grid; current selection card; progress for locked.
 */

import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../state/gameStore";
import {
  TITLE_MILESTONES,
  getFirstUnlockScore,
  getTitleById,
  type TitleMilestone,
  type TitleMilestoneId,
} from "../data/titleUnlocks";
import { colors, spacing, typography, borderRadius } from "../theme";
import * as haptics from "../services/haptics";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/** Locked titles with requiredScore above this show "???" instead of the name. */
const HIDDEN_TITLE_SCORE_THRESHOLD = 25000;

function TitleCard({
  item,
  totalScore,
  selectedTitleId,
  seenTitleIds,
  onSelect,
  hapticsEnabled,
}: {
  item: TitleMilestone;
  totalScore: number;
  selectedTitleId: string | null;
  seenTitleIds: string[];
  onSelect: (id: TitleMilestoneId) => void;
  hapticsEnabled: boolean;
}) {
  const unlocked = totalScore >= item.requiredScore;
  const selected = selectedTitleId === item.id;
  const isNew = unlocked && !seenTitleIds.includes(item.id);
  const progress = Math.min(1, totalScore / item.requiredScore);
  const scale = useSharedValue(1);
  const isHidden = !unlocked && item.requiredScore > HIDDEN_TITLE_SCORE_THRESHOLD;
  const displayName = isHidden ? "???" : item.name;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (!unlocked) return;
    if (hapticsEnabled) haptics.impactLight();
    scale.value = 0.96;
    scale.value = withSpring(1, { damping: 14, stiffness: 200 });
    onSelect(item.id);
  };

  return (
    <AnimatedTouchable
      style={[
        styles.card,
        unlocked ? styles.cardUnlocked : styles.cardLocked,
        selected && styles.cardSelected,
        animatedStyle,
      ]}
      onPress={handlePress}
      activeOpacity={1}
      disabled={!unlocked}
    >
      {isNew && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      )}
      {unlocked ? (
        <>
          <View style={styles.cardChip}>
            <Text style={styles.cardChipText}>UNLOCKED</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {displayName}
          </Text>
          <Text style={selected ? styles.cardSelectedLabel : styles.cardSelectLabel}>
            {selected ? "SELECTED" : "SELECT"}
          </Text>
        </>
      ) : (
        <>
          <View style={styles.cardLockIcon}>
            <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
          </View>
          <Text style={styles.cardTitleLocked} numberOfLines={2}>
            {displayName}
          </Text>
          <Text style={styles.cardRequired}>
            Unlock at {item.requiredScore.toLocaleString()}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </>
      )}
    </AnimatedTouchable>
  );
}

export default function UnlocksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const totalScore = useGameStore((s) => s.totalScore);
  const selectedTitleId = useGameStore((s) => s.selectedTitleId);
  const seenTitleIds = useGameStore((s) => s.seenTitleIds);
  const setSelectedTitleId = useGameStore((s) => s.setSelectedTitleId);
  const markUnlocksScreenSeen = useGameStore((s) => s.markUnlocksScreenSeen);
  const hapticsEnabled = useGameStore((s) => s.settings.hapticsEnabled);

  useFocusEffect(
    useCallback(() => {
      markUnlocksScreenSeen();
    }, [markUnlocksScreenSeen])
  );

  const selectedTitle = getTitleById(selectedTitleId as TitleMilestoneId | null);
  const firstUnlockScore = getFirstUnlockScore();
  const hasAnyUnlock = totalScore >= firstUnlockScore;

  const contentPadding = insets.left + insets.right + spacing.lg * 2;
  const cardWidth = (width - contentPadding - spacing.sm) / 2;

  const rows = useMemo(() => {
    const r: TitleMilestone[][] = [];
    for (let i = 0; i < TITLE_MILESTONES.length; i += 2) {
      r.push(TITLE_MILESTONES.slice(i, i + 2));
    }
    return r;
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.lg,
            paddingLeft: insets.left + spacing.lg,
            paddingRight: insets.right + spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.85}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Unlocks</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.scoreBlock}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{totalScore.toLocaleString()}</Text>
        </View>

        {hasAnyUnlock && (
          <View style={styles.currentCard}>
            <Text style={styles.currentLabel}>Current Title</Text>
            <Text style={styles.currentTitle}>
              {selectedTitle ? selectedTitle.name : "None"}
            </Text>
            <Text style={styles.currentSubtitle}>Unlocked by score milestones</Text>
          </View>
        )}

        {!hasAnyUnlock && (
          <View style={styles.emptyCallout}>
            <Text style={styles.emptyCalloutText}>
              Score {firstUnlockScore.toLocaleString()} to unlock your first title.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Titles</Text>
        <View style={styles.grid}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((item) => (
                <View key={item.id} style={[styles.cell, { width: cardWidth }]}>
                  <TitleCard
                    item={item}
                    totalScore={totalScore}
                    selectedTitleId={selectedTitleId}
                    seenTitleIds={seenTitleIds}
                    onSelect={(id) => setSelectedTitleId(id as TitleMilestoneId)}
                    hapticsEnabled={hapticsEnabled}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.endGoalSectionTitle}>Beyond</Text>
        <View style={styles.endGoalCard}>
          <View style={styles.endGoalLockIcon}>
            <Ionicons name="diamond" size={20} color="rgba(255,215,0,0.9)" />
          </View>
          <Text style={styles.endGoalTitle}>??? ??? ???</Text>
          <Text style={styles.endGoalSubtitle}>
            Beyond enlightenment lies the true crown. Keep playing to discover.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
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
  topBarSpacer: {
    width: 40,
    height: 40,
  },
  scoreBlock: {
    alignItems: "center",
    marginBottom: spacing.md,
    paddingVertical: 2,
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: 1,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  currentCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(0,245,212,0.25)",
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  currentLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  currentTitle: {
    ...typography.header,
    fontSize: 17,
    color: colors.text,
    marginBottom: 2,
  },
  currentSubtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  emptyCallout: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
  },
  emptyCalloutText: {
    ...typography.caption,
    color: colors.text,
    textAlign: "center",
  },
  sectionTitle: {
    ...typography.caption,
    color: "rgba(234,240,255,0.55)",
    marginBottom: spacing.sm,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  grid: {
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cell: {
    alignItems: "stretch",
  },
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minHeight: 100,
  },
  cardUnlocked: {
    backgroundColor: "rgba(0,245,212,0.08)",
    borderColor: "rgba(0,245,212,0.35)",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  cardLocked: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.10)",
    opacity: 0.9,
  },
  cardSelected: {
    borderColor: colors.accent,
    borderWidth: 2,
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  newBadge: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.rose,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  cardChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,245,212,0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: 6,
  },
  cardChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: 0.5,
  },
  cardTitle: {
    ...typography.header,
    color: colors.text,
    marginBottom: 6,
  },
  cardTitleLocked: {
    ...typography.header,
    color: colors.textMuted,
    marginBottom: 4,
  },
  cardSelectLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.accent,
  },
  cardSelectedLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.accent,
    fontWeight: "800",
  },
  cardLockIcon: {
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  cardRequired: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 6,
  },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  endGoalSectionTitle: {
    ...typography.caption,
    color: "rgba(255,215,0,0.5)",
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  endGoalCard: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "rgba(30,22,8,0.85)",
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: "rgba(255,215,0,0.4)",
    padding: spacing.lg,
    paddingTop: spacing.lg + 4,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  endGoalLockIcon: {
    alignSelf: "center",
    marginBottom: spacing.sm,
    opacity: 0.95,
  },
  endGoalTitle: {
    ...typography.header,
    fontSize: 20,
    color: "rgba(255,215,0,0.95)",
    textAlign: "center",
    letterSpacing: 4,
    marginBottom: spacing.sm,
    textShadowColor: "rgba(255,215,0,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  endGoalSubtitle: {
    ...typography.caption,
    fontSize: 12,
    color: "rgba(255,220,130,0.75)",
    textAlign: "center",
    lineHeight: 18,
    letterSpacing: 0.5,
  },
});
