# Zon Blocks — Implementation Spec (Cursor / Expo)

This document is the single source of truth for implementing **Zen Blocks** in **Expo (React Native + TypeScript)**.  
Prioritize: **correctness → smooth interaction → persistence → ads placeholders → polish**.

---

## 1) Product Summary

A minimalist block-placement puzzle:

- Player is given a square grid and a tray of pieces.
- Drag pieces onto the grid; pieces **snap only when valid**.
- Pieces **cannot rotate/flip** (player cannot change orientation).
- Pieces **cannot overlap**.
- Once placed, pieces are **locked** and cannot be moved.
- Goal: **fill the entire grid** to complete the level.
- Progression is linear: level 1 → 2 → 3… no level selection.
- Progress is saved; user resumes from the last level.

Monetization:
- **Rewarded ad** to gain extra undo beyond the 1 free undo per level.
- **Rewarded ad** to skip a level after a failure.
- **Interstitial ad** after every **4th level completion**.

---

## 2) Tech Stack Requirements

- Expo + React Native + TypeScript
- react-native-gesture-handler + react-native-reanimated (for drag + smooth animations)
- Zustand (state)
- AsyncStorage (persistence)
- Expo Haptics + Expo AV (sound)

Ads: implement **ad adapter interface** with placeholders (no SDK required initially).

---

## 3) Screen Requirements

### 3.1 Welcome Screen
- Title: “Zen Blocks”
- Primary button: Play
- Settings icon button

### 3.2 Game Screen
- Header: back (optional) + **Level N**
- Main: grid board
- Bottom: tray of remaining pieces
- Undo button with badge:
  - `Undo (1)` when free undo available
  - `Undo` when none available (tapping opens rewarded modal)

### 3.3 Settings Screen
- Sound toggle
- Haptics toggle
- Placeholder actions: Privacy, Restore

### 3.4 Failure Modal
Text: “No moves left”
Buttons:
- Retry Level
- Undo (Watch Ad)
- Skip Level (Watch Ad)

No “Level Complete” modal. Completion is a ripple animation + brief pause then next level.

---

## 4) Core Rules & UX

### 4.1 Placement Validity
A piece placement is valid if:
- all occupied cells in piece map to cells within grid bounds
- all target cells are currently empty

Do not allow “temporary overlap” while dragging to finalize; the drop must be valid to commit.

### 4.2 Locked Pieces
Once placed, pieces cannot be moved. Undo removes the **most recently placed** piece.

### 4.3 Undo
- Each level starts with **1 free undo** (`undosRemaining = 1`).
- If undosRemaining > 0:
  - tap undo → undo immediately and decrement undosRemaining
- Else:
  - tap undo → modal “Watch ad to undo”
  - on rewarded success → perform undo (no need to add “undosRemaining”; just allow a single undo per ad)

### 4.4 Failure Condition
Failure occurs when:
- at least one piece remains **and**
- there is no valid placement for **any** remaining piece

Show Failure Modal.

### 4.5 Skip Level
Skip is available only from failure modal:
- Watch rewarded ad → increment level number → generate next level.

### 4.6 Interstitial Timing
After every **4th level completion**:
- completion animation finishes → show interstitial → then load next level

Never show interstitial mid-level or after failure.

---

## 5) Game Feel Requirements (Animations, Haptics, Sound)

### 5.1 Placement Feedback
On successful placement:
- snap-to-grid animation (target 80–120ms)
- tiny settle scale (e.g., 1.02 → 1.0)
- light haptic impact
- “glassy tap” sound

### 5.2 Completion Feedback
On level complete:
- ripple animation across filled cells (600–800ms total)
- soft glow pulse
- gentle success chord
- after ~500ms, transition to next level (or after interstitial if needed)

### 5.3 Undo Feedback
Undo animation:
- piece lifts slightly
- fades & shrinks (200–250ms)
- reverse “glassy” tone
- subtle haptic tick

### 5.4 Settings Compliance
If sound disabled: do not play any audio.
If haptics disabled: no haptics.

---

## 6) Data Model

### 6.1 Shape Representation
Represent shapes as integer matrices (1 = filled, 0 = empty), plus an id.

Example:
```ts
type Shape = {
  id: string;
  cells: number[][]; // rectangular matrix
  unitCount: number; // count of 1s
};
```

### 6.2 Piece Instance
A piece is a shape + visual properties + placement state.

Example:
```ts
type Piece = {
  pieceId: string;
  shapeId: string;
  cells: number[][];
  width: number;  // matrix cols
  height: number; // matrix rows
  colorKey: string;
};
```

### 6.3 Placement Record
Store a placement so it can be undone.

Example:
```ts
type Placement = {
  pieceId: string;
  topLeft: { r: number; c: number };
  occupied: Array<{ r: number; c: number }>; // computed cells
};
```

### 6.4 Level State

Example:
```ts
type LevelState = {
  levelNumber: number;
  gridSize: number;
  grid: number[][]; // 0 empty, 1 filled (or piece index if desired)
  remainingPieces: Piece[];
  placedPlacements: Placement[]; // stack for undo
  undosRemaining: number; // starts at 1
};
```

## 7) State Management (Zustand)

Create a `useGameStore` with:

### State

**settings**
- `soundEnabled`
- `hapticsEnabled`

**progression**
- `currentLevelNumber`

**active level**
- `levelState`

### Actions

- `initApp()`
- `startNewLevel(levelNumber)`
- `placePiece(pieceId, topLeft)`
- `undo()`
- `retryLevel()`
- `checkFailure()`
- `completeLevel()`
- `skipLevelRewarded()`
- `showInterstitialIfNeeded()`

### Persistence

- Save `currentLevelNumber` and settings to **AsyncStorage**
- On initialization, restore saved state and resume progress

---

## 8) Level Generation (Must Always Be Solvable)

### 8.1 Strategy

Generate levels by **tiling a blank grid completely with pieces**, then shuffle the resulting pieces for the tray.

This guarantees solvability.

### Constraints

- Grid size: **4–9**
- Shapes: **1–5 blocks** (polyominoes)
- Player cannot rotate pieces
- Generator may choose piece orientation during level creation

---

### 8.2 Generator Steps

1. Choose `gridSize` based on level number and curated difficulty curve.
2. Create an empty grid.
3. Perform a tiling fill:
   - Maintain list of candidate shapes (by difficulty tier)
   - Pick the next empty cell (top-left scan)
   - Try placing a random shape/orientation that fits
   - Backtrack if stuck (bounded retries)
4. When grid is filled, create `Piece[]` from placed shapes.
5. Shuffle pieces (Fisher–Yates).
6. *(Optional)* Ensure piece count and variety meet difficulty targets.

---

### 8.3 Difficulty Curve (Simple)

- **Level 1–8:** grid 4–5, mostly Tier 1 shapes  
- **Level 9–30:** grid 5–6, add Tier 2 shapes  
- **Level 31–80:** grid 6–7, more Tier 2  
- **Level 81+:** grid 7–9 with occasional smaller “rest” levels, add Tier 3  

**Target completion time:** 20–40 seconds  
Keep piece count moderate — too many tiny pieces feels tedious.

---

## 9) Shape Library (V1)

Include polyominoes made of **1–5 blocks**.

### Tier 1
- single
- domino
- 3-line
- small L (3)

### Tier 2 (Tetrominoes)
- O (2×2)
- I (4)
- L (4)
- T (4)
- Z (4)

### Tier 3 (5-block)
- 5-line
- long L
- extended T
- plus
- step

Represent each shape as a matrix.

Precompute rotated variants for generator use, but assign one orientation per piece instance (player cannot rotate).

---

## 10) Drag & Snap Implementation

Use gesture handler for dragging pieces from the tray.

### Required Behavior

**During drag**
- show piece ghost above grid

**While hovering**
- determine nearest grid cell (top-left anchor)
- highlight valid placement cells (subtle glow)

**On release**
- if valid → commit placement (update grid, remainingPieces, placement stack)
- else → animate piece back to tray

### Implementation Notes

- Convert screen coordinates to grid coordinates using measured grid layout.
- Compute occupied cells from shape matrix and anchor cell.
- Validity check must be **O(k)** where *k* = number of filled cells in the piece.

---

## 11) Completion & Failure Checks

After each placement:

1. If grid has no empty cells → `completeLevel()`
2. Else run `checkFailure()`:
   - For each remaining piece:
     - scan possible anchors (0..gridSize-1)
     - if any valid placement exists → not failed
   - if none exist → show failure modal

Brute force is acceptable (grid ≤ 9).

---

## 12) Ads Adapter (Placeholder)

Create an interface:

```ts
type RewardedResult = "completed" | "dismissed" | "error";

interface AdsService {
  showRewarded(): Promise<RewardedResult>;
  showInterstitial(): Promise<void>;
}
```

### MockAdsService Bahavior
* Waits 600-1200ms
* resolves `completed` most of the (~90%) for testing
* interstitial dispalys a full-screen placeholder modal

### Integrations
* rewarded undo when `undosRemaining == 0`
* rewarded skip level from failure modal
* interstitial after every 4th level completion

## 13) File / Folder Structure
```
/src
  /components
    Grid.tsx
    Piece.tsx
    PieceTray.tsx
    LevelHeader.tsx
    FailureModal.tsx
    RewardedModal.tsx
  /game
    shapes.ts
    shapeRotations.ts
    levelGenerator.ts
    placement.ts
    gridUtils.ts
    difficultyCurve.ts
  /services
    ads.ts
    sound.ts
    haptics.ts
    storage.ts
  /state
    gameStore.ts
  /screens
    WelcomeScreen.tsx
    GameScreen.tsx
    SettingsScreen.tsx
  App.tsx
```

## 14) Acceptance Criteria (Definition of Done)
V1 is complete when:

* App launches to Welcome → Play starts Level 1
* Dragging pieces feels smooth; invalid drops return to tray
* Valid placement snaps + haptic + sound (if enabled)
* Level completion triggers ripple animation and advances
* Every 4th completed level shows interstitial placeholder
* Failure modal appears when no moves exist
* Retry works correctly
* Undo:
    * 1 free undo per level
    * extra undo requires rewarded ad placeholder
* Skip level requires rewarded placeholder
* Progress persists after relaunch
* Settings persist and apply immediately

## 15) Implementation Plan (Recommended Order)
1. Scaffold Expo TS project + navigation
2. Zustand store + AsyncStorage persistence
3. Shape library + helpers
4. Grid rendering & layout measurement
5. Tray rendering (mini-grids)
6. Drag & drop interaction + snap validation
7. Placement state updates
8. Undo stack + undo animations
9. Completion detection + ripple animation + level advance
10. Failure detection + modal actions
11. AdsService placeholder integration
12. Settings screen + sound/haptics services

## 16) Visual Style Notes
* Minimalist pastel palette
* Soft rounded corners
* Subtle shadows (no heavy outlines)
* Calm typography
* Board & tray spacing should support a “Zen puzzle” feel