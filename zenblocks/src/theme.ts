/**
 * Vibrant, eye-catching palette: rich colors, strong contrast, playful but polished.
 */

export const colors = {
  background: "#EDE6F2",
  surface: "#FFFFFF",
  surfaceElevated: "#F8F5FC",
  text: "#1A1520",
  textMuted: "#5A5166",
  border: "#D4C8E0",
  gridLine: "#C2B2D4",
  cellEmpty: "#E8E0F0",
  cellFilled: "#B8A8C8",
  // Piece colors – saturated and distinct
  coral: "#E85D4D",
  mint: "#3DB86B",
  sky: "#3D8FD4",
  lavender: "#8B5EB8",
  peach: "#E89A2E",
  sage: "#5A9B4A",
  rose: "#D84A5A",
  sand: "#C49240",
  // UI – bold purple, drawer
  primary: "#6B4C9E",
  primaryPressed: "#5A3D8A",
  primaryGlow: "rgba(107, 76, 158, 0.35)",
  danger: "#C44C4C",
  validHighlight: "rgba(107, 76, 158, 0.5)",
  validHighlightBorder: "#6B4C9E",
  ripple: "rgba(255,255,255,0.6)",
  drawer: "#E0D6EC",
  drawerBorder: "#C9B8DC",
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
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  display: { fontSize: 36, fontWeight: "700" as const },
  title: { fontSize: 26, fontWeight: "700" as const },
  header: { fontSize: 18, fontWeight: "600" as const },
  body: { fontSize: 16, fontWeight: "500" as const },
  caption: { fontSize: 14, fontWeight: "500" as const },
  button: { fontSize: 16, fontWeight: "700" as const },
};
