# Charm City Nights — Design System Source of Truth

> Generated from Stitch project `8455593271807593163` — charm-city-nights  
> Cross-reference with `mobile/constants/theme.ts`

---

## Screens Inventory

| Screen ID | Title | Maps To |
|-----------|-------|---------|
| `45a9bf6a38014aceb033e494491c1333` | Venue: The Kinetic Lounge | `mobile/app/bar/[id].tsx` |
| `b2f0dc7be9b44d7ba33e00742db89684` | Project Plan: Baltimore Nightlife App | Reference doc only |
| `8cef7943ab3543b6861a3c32aa88d6ec` | Collection: B-More Dex | `mobile/app/(tabs)/crawl.tsx` |
| `bed5f976404d452e8b3623c9c2679029` | Capture: New Story | `mobile/app/camera.tsx` |
| `4eda1309859a4c1597c29dfabf82242b` | Home: Map & Hotspots | `mobile/app/(tabs)/map.tsx` |

---

## 1. Color Palette (Exact Hex Values)

### Primary
| Token | Hex | Usage |
|-------|-----|-------|
| `primary_container` | `#FF5C00` | CTAs, active nav, hotspot pulses, focus states |
| `primary` | `#FFB59A` | Soft highlight, hover states, secondary accent |
| `primary_fixed` | `#FFDBCE` | Light tint |
| `primary_fixed_dim` | `#FFB59A` | Same as primary |
| `on_primary` | `#5A1B00` | Text on primary fills |
| `on_primary_container` | `#521800` | Text on primary_container |
| `inverse_primary` | `#A73A00` | Inverted primary |

### Secondary (Metallic Gold — VIP/Status)
| Token | Hex | Usage |
|-------|-----|-------|
| `secondary` | `#E9C349` | VIP tags, rank labels, gold badges, landmark badges |
| `secondary_container` | `#AF8D11` | Gold fills |
| `secondary_fixed` | `#FFE088` | Light gold |
| `secondary_fixed_dim` | `#E9C349` | Same as secondary |
| `on_secondary` | `#3C2F00` | Text on gold fills |

### Tertiary (Pure Gold)
| Token | Hex | Usage |
|-------|-----|-------|
| `tertiary` | `#E9C400` | Pure gold highlights |
| `tertiary_container` | `#C9A900` | Gold container |
| `tertiary_fixed` | `#FFE16D` | Light gold |

### Surfaces (The Dark Canvas)
| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#131313` | App background |
| `surface` | `#131313` | Same as background |
| `surface_dim` | `#131313` | Dimmed surface |
| `surface_container_lowest` | `#0E0E0E` | Deepest floor (image overlays) |
| `surface_container_low` | `#1C1B1B` | Cards, list rows |
| `surface_container` | `#201F1F` | Mid-level containers |
| `surface_container_high` | `#2A2A2A` | Elevated cards, menus |
| `surface_container_highest` | `#353534` | Highest surface / chips |
| `surface_bright` | `#3A3939` | Brightest surface element |
| `surface_variant` | `#353534` | Glass card base |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `on_surface` | `#E5E2E1` | Primary text (never pure white) |
| `on_background` | `#E5E2E1` | Body text on background |
| `on_surface_variant` | `#E4BEB1` | Secondary/muted text |

### Borders
| Token | Hex | Usage |
|-------|-----|-------|
| `outline` | `#AB897D` | Standard outlines |
| `outline_variant` | `#5B4137` | Ghost borders (at 20% opacity) |

### Error
| Token | Hex | Usage |
|-------|-----|-------|
| `error` | `#FFB4AB` | Error text |
| `error_container` | `#93000A` | Error background |

---

## 2. Typography

**Font Family:** Manrope (exclusive — all roles)  
**Weights used:** 200, 300, 400, 500, 600, 700, 800

| Role | Size | Weight | Letter Spacing | Usage |
|------|------|--------|----------------|-------|
| Display-LG | 3.5rem (56px) | 900 (Black) | tight / negative | Hero numbers, countdowns |
| Display-MD | ~3rem (48px) | 900 (Black) | `tracking-tighter` | Main hero text (`THE KINETIC LOUNGE`) |
| Headline-MD | 1.75rem (28px) | 800 (ExtraBold) | `tracking-tight` | Section headers |
| Title-LG | 1.375rem (22px) | 700 (Bold) | normal | Card titles, nav items |
| Title-MD | 1.25rem (20px) | 900 (Black) | `tracking-widest` | App bar brand name (ALL CAPS) |
| Body-LG | 1rem (16px) | 400 (Regular) | normal | Descriptions, venue bios |
| Body-SM / Label-MD | 0.75rem (12px) | 700–800 | normal | Captions, timestamps |
| Micro | 0.625rem (10px) | 800 (ExtraBold) | `tracking-widest` or `tracking-[0.3em]` | Tags, status chips (ALL CAPS) |

**Typographic Rules:**
- App bar brand: `text-xl font-black uppercase tracking-widest text-[#FF5C00]`
- Hero headline: `font-black tracking-tighter leading-none` with gradient clip on accent word
- Section label (above headline): `text-[10px] font-extrabold uppercase tracking-[0.3em] text-on-surface/30`
- Never use pure white (`#FFFFFF`) — use `on_surface` (#E5E2E1) always

---

## 3. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `DEFAULT` | `0.25rem` (4px) | Small elements |
| `lg` | `0.5rem` (8px) | Standard rounded |
| `xl` | `0.75rem` (12px) | Cards, badge circles |
| `2xl` | `1.5rem` (24px) | Large cards (Collection screen), bottom nav |
| `full` | `9999px` | Pills, buttons, nav active indicator, story circles |

**Key usages:**
- Bottom nav: `rounded-t-[1.5rem]` (24px top corners only)
- Primary buttons: `rounded-full`
- Content cards: `rounded-xl` (12px) or `rounded-2xl` (24px) for featured
- Badge circles: `rounded-full` with `w-20 h-20`
- Story avatars: `rounded-full`
- Input fields: `rounded-full` (pill shape)

---

## 4. Spacing & Padding

**Spacing Scale:** `spacingScale: 2` (base 8px)

| Usage | Value |
|-------|-------|
| Screen horizontal padding | `px-6` (24px) |
| Top app bar height | `h-16` (64px) |
| Bottom nav padding bottom | `pb-6` (24px) |
| Bottom nav padding top | `pt-3` (12px) |
| Card inner padding | `p-5` (20px) or `p-8` (32px) for featured |
| Section gap | `space-y-8` (32px) or `mb-12` (48px) |
| List item gap | `gap-4` (16px) or `gap-6` (24px) |
| Badge grid gap | `gap-6` (24px) |
| Story circle gap | `gap-4` (16px) |
| Nav item padding | `p-3` (12px) |

---

## 5. Component Patterns

### App Bar (shared across all screens)
```
bg-[#131313]/60 backdrop-blur-xl
h-16 fixed top-0 z-50
justify-between items-center px-6
Brand: text-xl font-black uppercase tracking-widest text-[#FF5C00]
Icons: text-[#FF5C00] or text-[#E5E2E1]/60, hover:text-[#FFB59A]
```

### Bottom Navigation Bar (shared across all screens)
```
fixed bottom-0 z-50
rounded-t-[1.5rem]
bg-[#131313]/80 backdrop-blur-2xl
shadow-[0_-8px_32px_rgba(0,0,0,0.5)]
px-4 pb-6 pt-3
5 tabs: map, layers(discover), photo_camera(center CTA), military_tech(collection), person(profile)
Active: bg-[#FF5C00] text-white rounded-full p-3 shadow-[0_0_15px_rgba(255,92,0,0.4)]
Inactive: text-[#E5E2E1]/40 p-3 hover:text-[#FFB59A]
```

### Glass Card
```css
background: rgba(53, 53, 52, 0.6);
backdrop-filter: blur(20px);
border: 1px solid rgba(91, 65, 55, 0.1); /* outline-variant at 10% */
border-radius: 0.75rem; /* xl */
```

### Primary Button (CTA)
```
bg-gradient-to-r from-[#FF5C00] to-[#FFB59A]
text-[#521800] (on-primary-container)
px-6 py-3 rounded-full
font-extrabold text-[12px] uppercase tracking-[0.2em]
shadow-xl
active:scale-95 transition-transform
```

### Ghost Button (Secondary)
```
bg-surface-variant/40 backdrop-blur-xl
border border-outline-variant/20
text-on-surface
px-6 py-3 rounded-full
font-extrabold text-[12px] uppercase tracking-[0.2em]
active:scale-95
```

### Gold/Tertiary Button (VIP action)
```
bg-secondary-container/10
border border-secondary/20
text-secondary (#E9C349)
font-black uppercase tracking-widest
rounded-2xl py-5
```

### Chips / Filter Pills
- Unselected: `bg-surface-container-highest` (`#353534`)
- Selected: `bg-primary-container` (`#FF5C00`)
- Shape: `rounded-full px-4 py-2`
- Text: `text-xs font-bold uppercase tracking-widest`

### Badge Circle (Collection screen)
```
w-20 h-20 rounded-full
bg-surface-container-low
border border-primary-container/30 (collected) | border-white/5 (uncollected)
shadow-[0_0_15px_rgba(255,92,0,0.1)] (collected) | filter: grayscale(100%) (uncollected)
opacity-40 on uncollected
group-hover:scale-110 transition-transform
```

### Story Circle (Avatar ring)
```
w-16 h-16 rounded-full p-[2px]
Active ring: bg-gradient-to-tr from-primary-container via-secondary to-primary
Inactive ring: bg-outline-variant/30
Inner: border-2 border-background rounded-full overflow-hidden
```

### Story/Venue Card (horizontal scroll)
```
min-w-[160px] h-64
bg-surface-container-low rounded-xl
border border-outline-variant/10
Image fills card, group-hover:scale-110 transition-transform duration-700
Overlay: bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent
Venue label: text-[10px] font-bold uppercase tracking-widest text-secondary
Card title: text-xs font-bold
LIVE badge: bg-primary-container/20 + animated pulse dot
```

### XP / Progress Bar
```
h-3 rounded-full bg-surface-container-highest
Fill: bg-gradient-to-r from-primary-container to-primary
shadow-[0_0_20px_rgba(255,92,0,0.5)]
```

### VIP Status Badge (floating)
```
glass-panel px-4 py-3 rounded-xl
border border-secondary/20
Label: text-[9px] font-black tracking-[.3em] text-secondary uppercase
Value: text-sm font-bold tracking-tight text-on-surface
Icon: text-secondary military_tech (filled)
```

### Hotspot Pulse (Map)
```css
@keyframes pulse {
  0%   { box-shadow: 0 0 0 0 rgba(255,92,0,0.7); }
  70%  { box-shadow: 0 0 0 15px rgba(255,92,0,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,92,0,0); }
}
w-4 h-4 bg-primary-container rounded-full animation: pulse 2s infinite
```

### Camera Capture Button
```
w-20 h-20 bg-primary-container rounded-full
border-4 border-white
shadow-[0_0_25px_rgba(255,92,0,0.8)]
active:scale-90 transition-all duration-150
SVG progress ring: stroke #FF5C00, stroke-width 4, stroke-linecap round
```

### Inline Mission Prompt (Camera)
```
bg-surface-container-high/60 backdrop-blur-xl
border border-outline-variant/20 rounded-2xl p-4
Icon: w-12 h-12 rounded-full bg-tertiary-container/30 border border-tertiary/30
Icon color: text-tertiary (filled military_tech)
Title: text-sm font-bold
Sub: text-primary text-[11px] font-bold uppercase tracking-widest
```

---

## 6. Animation & Effects

| Effect | Spec |
|--------|------|
| Hotspot pulse | `2s infinite` radial box-shadow expansion from `#FF5C00` |
| Button press | `active:scale-95` or `active:scale-90` (camera) `transition-transform` |
| Card hover zoom | `group-hover:scale-110 transition-transform duration-700` |
| Badge hover | `group-hover:scale-110 transition-transform` |
| Nav icon hover | `hover:text-[#FFB59A] transition-all duration-300 ease-out` |
| Glass blur | `backdrop-filter: blur(20px)` on glass cards, `backdrop-blur-xl` on nav/header |
| Orange glow text shadow | `text-shadow: 0 0 12px rgba(255,92,0,0.4)` |
| Orange glow box shadow | `shadow-[0_0_15px_rgba(255,92,0,0.4)]` on active nav |

---

## 7. Navigation Structure

### Bottom Tab Bar (5 tabs)
| Tab | Icon | Active Screen |
|-----|------|---------------|
| Map | `map` | Home: Map & Hotspots |
| Discover | `layers` | Discover/Feed |
| Camera | `photo_camera` | Capture: New Story (center, always orange) |
| Collection | `military_tech` | Collection: B-More Dex |
| Profile | `person` | Profile |

### Active State Pattern
The active tab gets: `bg-[#FF5C00] text-white rounded-full p-3 shadow-[0_0_15px_rgba(255,92,0,0.4)]`  
Camera tab is **always** styled as active (it's the primary action).

---

## 8. Design Principles (The "Kinetic Lounge" Rules)

1. **No pure white** — always `#E5E2E1` for text
2. **No dividers** — use background shifts and spacing instead
3. **Glass + Gradient** — CTAs use orange gradient; floating elements use glassmorphism
4. **Tonal layering** — depth via background shifts: `#0E0E0E` → `#131313` → `#1C1B1B` → `#2A2A2A`
5. **Ghost borders** — `outline_variant` (#5B4137) at 10–20% opacity only
6. **Negative space** — large gaps (`mb-12`, `space-y-16`) create the "gallery" feel
7. **Gold = premium** — `secondary` (#E9C349) reserved for VIP, rank, and landmark items
8. **Orange = action** — `primary_container` (#FF5C00) for every interactive CTA

---

## 9. Screen-Specific Notes

### Home: Map & Hotspots (`map.tsx`)
- Full-screen map background at `opacity-40 grayscale contrast-125`
- Radial gradient overlay: `radial-gradient(circle at center, transparent 0%, #131313 100%)`
- Floating glass search bar centered, `rounded-full`, below app bar
- Hotspot dots pulse on map with animation delay offsets
- Bottom sheet with horizontal scroll story cards (160px × 256px)
- VIP status badge floats top-right

### Venue: The Kinetic Lounge (`bar/[id].tsx`)
- Full-bleed hero image `h-[751px]` with `bg-gradient-to-t from-background via-transparent to-background/40`
- Story circle row overlaid on hero at `top-20`
- Live Vibes pill: `bg-primary-container/20 backdrop-blur-md border border-primary-container/30 rounded-full`
- Hero text: "THE KINETIC" plain, "LOUNGE" gradient (`from-primary-container to-secondary`) text-clip
- Bento grid below hero: 2-col with vibe card + badge card, then full-width music card
- Vibe text: `text-3xl font-black text-primary-container` ("PACKED")
- Info list: icon `text-secondary/60` + bold label + muted sublabel
- VIP table button: gold ghost style

### Collection: B-More Dex (`crawl.tsx` / `collection.tsx`)
- Level display: `text-5xl font-black italic tracking-tighter` 
- XP progress bar with orange glow
- Rare collectible uses double-glow card with negative-inset gradient border
- Badge grid: 6 columns on desktop, 3 on mobile
- Categories: Bars & Speakeasies, Elite Clubs, Baltimore Landmarks, Special Events
- Uncollected badges: `opacity-40 filter grayscale(100%)`
- Landmark badges use `secondary` (#E9C349) instead of `primary_container`

### Capture: New Story (`camera.tsx`)
- Full-screen camera viewport, `overflow-hidden h-screen`
- Top bar: `bg-gradient-to-b from-black/60 to-transparent` (not glass)
- Sidebar tools: right-side, vertically centered, `bg-black/40 backdrop-blur-md rounded-full`
- Bottom: `bg-gradient-to-t from-black/80 via-black/40 to-transparent`
- Filter selector: horizontal scroll circles (14px × 14px or 16px × 16px), active has `ring-2 ring-primary-container shadow-[0_0_15px_rgba(255,92,0,0.5)]`
- Mission badge prompt floats above filters with glass card style

---

## 10. Key Measurements Summary

```
App bar height:       64px  (h-16)
Bottom nav height:    ~80px (pb-6 pt-3 + icon)
Bottom nav radius:    24px  (rounded-t-[1.5rem])
Card radius (large):  24px  (rounded-2xl)
Card radius (std):    12px  (rounded-xl)
Button radius:        9999px (rounded-full)
Screen padding H:     24px  (px-6)
Badge circle:         80px × 80px
Story circle:         64px × 64px
Story card:           160px × 256px
Camera capture btn:   80px × 80px
Nav icon touch area:  p-3 = 12px padding all sides
Hero image height:    751px
```
