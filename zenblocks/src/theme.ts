/**
 * Neon Night palette: dark, high-contrast, vibrant neon accents.
 * Designed for a premium "night arcade / synthwave" vibe.
 */

export const colors = {
  // Base surfaces
  background: "#070814",        // deep navy/near-black
  surface: "#0D1030",           // card surface
  surfaceElevated: "#12164A",   // elevated surface
  text: "#EAF0FF",              // near-white
  textMuted: "rgba(234,240,255,0.72)",
  border: "rgba(255,255,255,0.10)",
  gridLine: "rgba(255,255,255,0.14)",

  // Board cells
  cellEmpty: "rgba(255,255,255,0.06)",
  cellFilled: "rgba(120, 100, 255, 0.35)",

  // Piece colors (neon)
  coral: "#FF4D6D",     // neon pink-red
  mint: "#00F5D4",      // neon teal
  sky: "#4EA8FF",       // neon blue
  lavender: "#B517FF",  // neon purple
  peach: "#FFB703",     // neon amber
  sage: "#7CFF6B",      // neon green
  rose: "#FF2EEA",      // hot pink
  sand: "#FFD166",      // bright gold

  // UI accents
  primary: "#8B5CF6",          // violet neon
  primaryPressed: "#6D28D9",
  primaryGlow: "rgba(139, 92, 246, 0.45)",

  // Secondary accent (cyan neon)
  accent: "#00F5D4",
  accentGlow: "rgba(0, 245, 212, 0.35)",

  danger: "#FF4D6D",

  validHighlight: "rgba(0, 245, 212, 0.22)",
  validHighlightBorder: "rgba(0, 245, 212, 0.65)",

  ripple: "rgba(255,255,255,0.65)",

  drawer: "#0B0E25",
  drawerBorder: "rgba(255,255,255,0.10)",
} as const;

export const pieceColorKeys = [
  "coral",
  "mint",
  "sky",
  "lavender",
  "peach",
  "sage",
  "rose",
  "sand",
] as const;

export type PieceColorKey = (typeof pieceColorKeys)[number];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  // "blocky title" effect is mostly achieved by styling + shadows
  display: { fontSize: 44, fontWeight: "800" as const, letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: "800" as const, letterSpacing: 0.3 },
  header: { fontSize: 18, fontWeight: "700" as const },
  body: { fontSize: 16, fontWeight: "600" as const },
  caption: { fontSize: 13, fontWeight: "600" as const },
  button: { fontSize: 17, fontWeight: "800" as const, letterSpacing: 0.3 },
};