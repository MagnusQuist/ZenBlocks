/**
 * Persistence for progress and settings.
 * Uses AsyncStorage when available; falls back to in-memory store when the native
 * module is null (e.g. some Expo Go / dev builds).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  CURRENT_LEVEL: "@neonblocks/currentLevel",
  SETTINGS: "@neonblocks/settings",
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
