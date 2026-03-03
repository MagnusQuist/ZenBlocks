/**
 * Persistence for progress and settings.
 * Uses AsyncStorage when available; falls back to in-memory store when the native
 * module is null (e.g. some Expo Go / dev builds).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  CURRENT_LEVEL: "@neonblocks/currentLevel",
  SETTINGS: "@neonblocks/settings",
  CONSECUTIVE_NO_UNDO: "@neonblocks/consecutiveNoUndo",
  TOTAL_SCORE: "@neonblocks/totalScore",
  BEST_TOTAL_SCORE: "@neonblocks/bestTotalScore",
  BEST_LEVEL_SCORES: "@neonblocks/bestLevelScoreByLevelId",
  SELECTED_TITLE_ID: "@neonblocks/selectedTitleId",
  SEEN_TITLE_IDS: "@neonblocks/seenTitleIds",
  ONBOARDING_DRAG_SEEN: "@neonblocks/onboardingDragSeen",
  ONBOARDING_SCROLL_SEEN: "@neonblocks/onboardingScrollSeen",
} as const;

export type StoredSettings = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
};

const DEFAULT_SETTINGS: StoredSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
};

const memoryFallback = new Map<string, string>();

async function getItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return memoryFallback.get(key) ?? null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  memoryFallback.set(key, value);
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // Keep in-memory copy; native module may be unavailable
  }
}

export async function getCurrentLevel(): Promise<number> {
  try {
    const s = await getItem(KEYS.CURRENT_LEVEL);
    if (s == null) return 1;
    const n = parseInt(s, 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  } catch {
    return 1;
  }
}

export async function setCurrentLevel(level: number): Promise<void> {
  await setItem(KEYS.CURRENT_LEVEL, String(level));
}

export async function getConsecutiveNoUndoCompletions(): Promise<number> {
  try {
    const s = await getItem(KEYS.CONSECUTIVE_NO_UNDO);
    if (s == null) return 0;
    const n = parseInt(s, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export async function setConsecutiveNoUndoCompletions(count: number): Promise<void> {
  await setItem(KEYS.CONSECUTIVE_NO_UNDO, String(Math.max(0, count)));
}

export type BestLevelScoreByLevelId = Record<number, number>;

export async function getTotalScore(): Promise<number> {
  try {
    const s = await getItem(KEYS.TOTAL_SCORE);
    if (s == null) return 0;
    const n = parseInt(s, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export async function setTotalScore(score: number): Promise<void> {
  await setItem(KEYS.TOTAL_SCORE, String(Math.max(0, score)));
}

export async function getBestTotalScore(): Promise<number> {
  try {
    const s = await getItem(KEYS.BEST_TOTAL_SCORE);
    if (s == null) return 0;
    const n = parseInt(s, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export async function setBestTotalScore(score: number): Promise<void> {
  await setItem(KEYS.BEST_TOTAL_SCORE, String(Math.max(0, score)));
}

export async function getBestLevelScoreByLevelId(): Promise<BestLevelScoreByLevelId> {
  try {
    const s = await getItem(KEYS.BEST_LEVEL_SCORES);
    if (!s) return {};
    const parsed = JSON.parse(s) as Record<string, number>;
    const out: BestLevelScoreByLevelId = {};
    for (const [k, v] of Object.entries(parsed)) {
      const id = parseInt(k, 10);
      if (Number.isFinite(id) && Number.isFinite(v) && v >= 0) out[id] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export async function setBestLevelScoreByLevelId(data: BestLevelScoreByLevelId): Promise<void> {
  await setItem(KEYS.BEST_LEVEL_SCORES, JSON.stringify(data));
}

export async function getSettings(): Promise<StoredSettings> {
  try {
    const s = await getItem(KEYS.SETTINGS);
    if (!s) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(s) as Partial<StoredSettings>;
    return {
      soundEnabled: parsed.soundEnabled ?? DEFAULT_SETTINGS.soundEnabled,
      hapticsEnabled: parsed.hapticsEnabled ?? DEFAULT_SETTINGS.hapticsEnabled,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function setSettings(settings: StoredSettings): Promise<void> {
  await setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export async function getSelectedTitleId(): Promise<string | null> {
  try {
    return await getItem(KEYS.SELECTED_TITLE_ID);
  } catch {
    return null;
  }
}

export async function setSelectedTitleId(id: string | null): Promise<void> {
  if (id) await setItem(KEYS.SELECTED_TITLE_ID, id);
  else await setItem(KEYS.SELECTED_TITLE_ID, "");
}

export async function getSeenTitleIds(): Promise<string[]> {
  try {
    const s = await getItem(KEYS.SEEN_TITLE_IDS);
    if (!s) return [];
    const parsed = JSON.parse(s) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function setSeenTitleIds(ids: string[]): Promise<void> {
  await setItem(KEYS.SEEN_TITLE_IDS, JSON.stringify(ids));
}

export async function getHasSeenDragIntro(): Promise<boolean> {
  try {
    const s = await getItem(KEYS.ONBOARDING_DRAG_SEEN);
    return s === "1";
  } catch {
    return false;
  }
}

export async function setHasSeenDragIntro(): Promise<void> {
  await setItem(KEYS.ONBOARDING_DRAG_SEEN, "1");
}

export async function getHasSeenScrollHint(): Promise<boolean> {
  try {
    const s = await getItem(KEYS.ONBOARDING_SCROLL_SEEN);
    return s === "1";
  } catch {
    return false;
  }
}

export async function setHasSeenScrollHint(): Promise<void> {
  await setItem(KEYS.ONBOARDING_SCROLL_SEEN, "1");
}
