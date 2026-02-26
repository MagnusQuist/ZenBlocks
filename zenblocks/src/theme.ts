/**
 * Vibrant palette: richer background and piece colors, clear UI.
 */

export const colors = {
  background: "#F5EEF5",
  surface: "#FFFFFF",
  surfaceElevated: "#FAF8FA",
  text: "#1E1B1E",
  textMuted: "#5C5660",
  border: "#DDD5E0",
  gridLine: "#C9C0D0",
  cellEmpty: "#EDE8ED",
  cellFilled: "#C4B8C8",
  // Piece colors – more saturated, easier to distinguish
  coral: "#E0786A",
  mint: "#5CB87A",
  sky: "#5A9FD4",
  lavender: "#9B7BB8",
  peach: "#E8A858",
  sage: "#7AAB6A",
  rose: "#D86A7A",
  sand: "#C9A86A",
  // UI – clear purple, drawer
  primary: "#7B5E9E",
  primaryPressed: "#6A4D8C",
  danger: "#B85C5C",
  validHighlight: "rgba(123, 94, 158, 0.45)",
  validHighlightBorder: "#7B5E9E",
  ripple: "rgba(255,255,255,0.5)",
  drawer: "#E8E2EC",
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
  full: 9999,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: "600" as const },
  header: { fontSize: 18, fontWeight: "600" as const },
  body: { fontSize: 16, fontWeight: "400" as const },
  caption: { fontSize: 14, fontWeight: "400" as const },
  button: { fontSize: 16, fontWeight: "600" as const },
};
