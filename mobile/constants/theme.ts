// ─── Charm City Nights — Design System ────────────────────────────────────────
// Source of truth: stitch-designs/DESIGN.md
// Stitch project: 8455593271807593163

// ─── Color Tokens ─────────────────────────────────────────────────────────────

export const Colors = {
  // Primary (Electric Orange)
  primary: '#FFB59A',              // soft highlight / hover states
  primaryContainer: '#FF5C00',     // CTAs, active nav, hotspot pulses ← MAIN ACTION COLOR
  primaryFixed: '#FFDBCE',
  primaryFixedDim: '#FFB59A',
  onPrimary: '#5A1B00',
  onPrimaryContainer: '#521800',
  inversePrimary: '#A73A00',

  // Secondary (Metallic Gold — VIP / Status)
  secondary: '#E9C349',            // VIP tags, rank labels, gold badges
  secondaryContainer: '#AF8D11',
  secondaryFixed: '#FFE088',
  secondaryFixedDim: '#E9C349',
  onSecondary: '#3C2F00',
  onSecondaryContainer: '#342800',

  // Tertiary (Pure Gold)
  tertiary: '#E9C400',
  tertiaryContainer: '#C9A900',
  tertiaryFixed: '#FFE16D',
  onTertiary: '#3A3000',
  onTertiaryContainer: '#4C3F00',

  // Surfaces (Dark Canvas)
  background: '#131313',
  surface: '#131313',
  surfaceDim: '#131313',
  surfaceContainerLowest: '#0E0E0E',  // deep floor / image overlays
  surfaceContainerLow: '#1C1B1B',     // cards, list rows  ← use as "card"
  surfaceContainer: '#201F1F',
  surfaceContainerHigh: '#2A2A2A',    // elevated cards / menus
  surfaceContainerHighest: '#353534', // chips unselected
  surfaceBright: '#3A3939',
  surfaceVariant: '#353534',          // glass card base
  surfaceTint: '#FFB59A',

  // Text
  onSurface: '#E5E2E1',             // primary text — NEVER pure white
  onBackground: '#E5E2E1',
  onSurfaceVariant: '#E4BEB1',      // secondary / muted text
  inverseSurface: '#E5E2E1',
  inverseOnSurface: '#313030',

  // Borders
  outline: '#AB897D',
  outlineVariant: '#5B4137',        // ghost borders at 10–20% opacity

  // Error
  error: '#FFB4AB',
  errorContainer: '#93000A',
  onError: '#690005',
  onErrorContainer: '#FFDAD6',

  // ─── Backward-compat aliases (referenced by existing screens) ───────────────
  card: '#1C1B1B',                  // was #1A1A2E
  success: '#00C9A7',
  purple: '#7B2FBE',
  textPrimary: '#E5E2E1',           // was #FFFFFF
  textSecondary: 'rgba(229,226,225,0.66)',
  textMuted: 'rgba(229,226,225,0.33)',
} as const;

export const BadgeRarity = {
  COMMON: '#9CA3AF',
  RARE: '#3B82F6',
  EPIC: '#8B5CF6',
  LEGENDARY: '#E9C349',  // gold to match Stitch
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
// Font: Manrope (exclusive). Weights: 200, 300, 400, 500, 600, 700, 800
// Backward-compat: BebasNeue + Outfit kept for existing screens

export const Fonts = {
  // Manrope (Stitch spec)
  manropeLight: 'Manrope_200ExtraLight',
  manropeRegular: 'Manrope_400Regular',
  manropeMedium: 'Manrope_500Medium',
  manropeSemiBold: 'Manrope_600SemiBold',
  manropeBold: 'Manrope_700Bold',
  manropeExtraBold: 'Manrope_800ExtraBold',

  // Stitch role aliases
  headline: 'Manrope_800ExtraBold',     // Section headers
  display: 'Manrope_800ExtraBold',      // Hero text — black/900 equiv
  body: 'Manrope_400Regular',           // Descriptions
  bodyLight: 'Manrope_300Light',
  bodySemiBold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  label: 'Manrope_700Bold',             // Chips, tags, uppercase labels
} as const;

// Typography scale (from DESIGN.md)
export const TypeScale = {
  displayLG: { fontSize: 56, lineHeight: 60, letterSpacing: -1 },
  displayMD: { fontSize: 48, lineHeight: 52, letterSpacing: -1 },
  headlineMD: { fontSize: 28, lineHeight: 34 },
  titleLG: { fontSize: 22, lineHeight: 28 },
  titleMD: { fontSize: 20, lineHeight: 26, letterSpacing: 3 },  // app bar brand ALL CAPS
  bodyLG: { fontSize: 16, lineHeight: 24 },
  bodySM: { fontSize: 12, lineHeight: 18 },
  micro: { fontSize: 10, lineHeight: 14, letterSpacing: 2 },    // tags, all-caps chips
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────
// spacingScale: 2 (base 8px)

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,    // screen horizontal padding
  xxxl: 32,
  section: 48,  // large section gap
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const Radius = {
  sm: 4,       // DEFAULT
  md: 8,       // lg
  lg: 12,      // xl — standard cards
  xl: 24,      // 2xl — large cards, bottom nav corners
  full: 9999,  // pill buttons, story circles, nav active
} as const;

// ─── Layout Measurements ─────────────────────────────────────────────────────

export const Layout = {
  appBarHeight: 64,
  bottomNavHeight: 80,
  bottomNavCornerRadius: 24,
  screenPaddingH: 24,
  badgeCircle: 80,
  storyCircle: 64,
  storyCardWidth: 160,
  storyCardHeight: 256,
  cameraCaptureBtn: 80,
  heroHeight: 360,   // mobile-adjusted from 751px web
} as const;

// ─── Glass Card Style ─────────────────────────────────────────────────────────
// Use these values anywhere you need glassmorphism
export const GlassStyle = {
  backgroundColor: 'rgba(53, 53, 52, 0.6)',
  borderColor: 'rgba(91, 65, 55, 0.1)',
  borderWidth: 1,
} as const;

// ─── Shadow Presets ───────────────────────────────────────────────────────────

export const Shadows = {
  orangeGlow: {
    shadowColor: '#FF5C00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  goldGlow: {
    shadowColor: '#E9C349',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  navBar: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 20,
  },
} as const;
