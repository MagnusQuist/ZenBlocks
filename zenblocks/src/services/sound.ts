/**
 * Sound effects. Respects settings (caller checks soundEnabled).
 * Uses Expo AV for "glassy tap" and success chord.
 */

import { Audio } from "expo-av";

let tapSound: Audio.Sound | null = null;
let successSound: Audio.Sound | null = null;
let undoSound: Audio.Sound | null = null;

async function ensureLoaded(): Promise<void> {
  // We use expo-av without actual asset files for placeholder; play silent or skip.
  // When assets are added: Audio.Sound.createAsync(require('@/assets/tap.mp3'))
}

export async function playTap(): Promise<void> {
  try {
    await ensureLoaded();
    if (tapSound) await tapSound.replayAsync();
  } catch {
    // no-op if no asset
  }
}

export async function playSuccess(): Promise<void> {
  try {
    await ensureLoaded();
    if (successSound) await successSound.replayAsync();
  } catch {
    // no-op
  }
}

export async function playUndo(): Promise<void> {
  try {
    await ensureLoaded();
    if (undoSound) await undoSound.replayAsync();
  } catch {
    // no-op
  }
}
