// Admin panel's color palette. Was defined identically (byte-for-byte) in
// layout.tsx, orders/page.tsx, and settings/page.tsx -- one copy here removes
// the risk of the three drifting apart.
//
// This is still the "COLORS object with inline styles" pattern flagged
// separately for migration onto the mak-* design tokens; consolidating the
// duplicates is a safe first step that doesn't require re-touching every
// admin page's styling to verify visually.
export const COLORS = {
  primary: "#D4AF37", // Luxury Gold
  primaryDark: "#A67C00", // Darker Gold
  primaryLight: "#F4CD68", // Lighter Gold
  secondary: "#0F0F0F", // Rich Black
  background: "#FFFFFF", // White
  surface: "#F8F8F8", // Off-White
  surfaceLight: "#F0F0F0", // Light Gray
  text: "#0F0F0F", // Rich Black for text
  textMuted: "#6D6D6D", // Muted Gray
  error: "#B00020", // Deep Red
  success: "#006400", // Deep Green
  inputBg: "#FFFFFF", // White
  inputBorder: "#D4AF37", // Gold for borders
  inputFocus: "#A67C00", // Darker Gold for focus
} as const;
