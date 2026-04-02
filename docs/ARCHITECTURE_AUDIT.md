# Charm City Nights — Full Architecture Audit
**Date:** 2026-04-02  
**Purpose:** Pre-deployment planning, cloud migration, CI/CD readiness  
**Scope:** Read-only analysis of all source files across mobile, web, and backend

---

## 1. App Overview

**What it is:** A Baltimore nightlife gamification platform. Users check in to bars, collect badges, record videos, complete bar crawl routes, earn XP/levels, and socialize via DMs/stories.

**Who it's for:** Baltimore bar-goers (end users), bar managers (staff tools), and admins.

**Primary User Flows:**
1. Sign up / Onboard → Land on Home tab (bar list)
2. Browse map → Navigate to bar → Check in (geo-verified, 300 ft radius)
3. Earn XP → Level up → Unlock badges (bar-specific, 4 rarity tiers)
4. Complete crawl routes → Earn bonus XP
5. Record/upload videos at bars
6. Claim vouchers via QR code (bar promotions)
7. Follow other users, DM, view stories

**Major Features:**
- Real-time crowd levels (Socket.io, refreshed every 5 min)
- Geo-verified check-ins (Haversine, 300 ft)
- Badge collection (Common/Rare/Epic/Legendary)
- Bar crawl routes with progress tracking
- User-generated video content (S3, moderation flow)
- Ephemeral stories (expiring media)
- Voucher system (bar promotions, QR redemption)
- Bar manager dashboard (staff access)
- Marketing campaign tracking model

**End-to-End:**
Expo mobile app → Express REST API + Socket.io → PostgreSQL (Prisma) → AWS Cognito (auth) + AWS S3 (media) + AWS Pinpoint (push)

---

## 2. Frontend Architecture

### Mobile (React Native / Expo)

- **Framework:** React Native 0.81.5, Expo 54.0.33, Expo Router 6.0.23 (file-based routing)
- **Styling:** NativeWind 4.2.3 + TailwindCSS 3.4.19, custom design tokens in `constants/theme.ts`
- **Fonts:** Manrope (primary), Outfit, Bebas Neue (legacy)
- **Maps:** @rnmapbox/maps 10.3.0
- **Real-time:** Custom WebSocket wrapper (`lib/socket.ts`)
- **Auth tokens:** expo-secure-store (encrypted device storage)
- **State:** Local `useState` / `useEffect` per screen — no global state library

#### Route Map

```
app/
├── _layout.tsx                  → Root: fonts, GestureHandler, Stack navigator
├── (auth)/
│   ├── _layout.tsx              → Auth stack
│   ├── index.tsx                → Login / Signup form
│   └── onboarding.tsx           → Onboarding slides
├── (tabs)/
│   ├── _layout.tsx              → Bottom tab bar (6 tabs)
│   ├── index.tsx                → Home: bar list, crowd colors
│   ├── map.tsx                  → Mapbox map, bar annotations, neighborhood picker
│   ├── crawls.tsx               → Bar crawl route list + progress
│   ├── camera.tsx               → Expo Camera video recording
│   ├── collection.tsx           → Badge grid
│   └── profile.tsx              → User stats, highlights, settings
├── bar/[id].tsx                 → Dynamic bar detail (specials, videos, staff)
├── dms/[userId].tsx             → DM chat screen
├── camera.tsx                   → Root-level camera modal
├── story-viewer.tsx             → Story viewer modal
├── notifications.tsx            → Notification list
└── messages.tsx                 → Messages inbox
```

#### Reusable Components (`mobile/components/ui/`)

| Component | Purpose | Reusable? |
|-----------|---------|-----------|
| BarCard.tsx | Bar listing card (crowd, emoji, name) | Yes |
| BarCardCompact.tsx | Smaller bar card for lists | Yes |
| VenueCard.tsx | Venue detail card | Yes |
| GlassCard.tsx | Glassmorphism container | Yes |
| Badge.tsx | Single badge display | Yes |
| BadgeCard.tsx | Badge with rarity border | Yes |
| CrowdMeter.tsx | Crowd level visualization | Yes |
| XPBar.tsx | XP progress bar | Yes |
| Avatar.tsx | User avatar with fallback | Yes |
| Button.tsx | Primary action button | Yes |
| Chip.tsx | Tag/label chip | Yes |
| StoryCircle.tsx | Story ring (like Instagram) | Yes |
| AppBar.tsx | Screen header | Yes |
| BottomSheet.tsx | Modal bottom sheet | Yes |
| Toast.tsx | Notification toast | Yes |
| SkeletonLoader.tsx | Loading skeleton | Yes |
| CameraButton.tsx | Camera capture button | Contextual |

#### Hooks / Lib / Utils

- `lib/api.ts` — Axios-style fetch wrapper, auto-injects Bearer token, handles 401 redirect, exposes all API functions
- `lib/socket.ts` — Lightweight WebSocket client for `crowd:update` events
- `constants/theme.ts` — Full design token system (colors, fonts, rarity)
- `constants/mockData.ts` — Development mock data
- `types/vault.ts` — TypeScript types

### Web (Next.js 16)

- **Framework:** Next.js 16.2.2, React 19
- **Styling:** TailwindCSS 4, Framer Motion 12, shadcn/ui
- **Backend:** Supabase (waitlist DB), Resend (email)
- **Purpose:** Marketing landing page + waitlist signup

#### Routes

```
web/src/app/
├── layout.tsx                   → Root layout with providers
├── page.tsx                     → Landing page (dynamic import)
└── api/
    ├── waitlist/route.ts        → POST: add to waitlist (email + crabs_found)
    └── waitlist-count/route.ts  → GET: return waitlist count
```

---

## 3. Project Structure

```
charm-city-nights/
├── backend/                     ← Express API server (TypeScript)
│   ├── src/
│   │   ├── index.ts             ← App entry: Express + Socket.io + workers
│   │   ├── middleware/
│   │   │   ├── auth.ts          ← JWT/Cognito JWKS verification, RBAC
│   │   │   ├── rateLimiter.ts   ← Express-rate-limit (general, checkin, auth)
│   │   │   └── upload.ts        ← Multer file upload handler
│   │   ├── routes/
│   │   │   ├── auth.ts          ← POST /sync, GET /me
│   │   │   ├── bars.ts          ← GET /bars, GET /bars/:id
│   │   │   ├── checkins.ts      ← POST /checkins (geo-verified)
│   │   │   ├── badges.ts        ← Badge collection endpoints
│   │   │   ├── crawls.ts        ← Crawl routes + progress
│   │   │   ├── videos.ts        ← Upload, status, moderation
│   │   │   ├── vouchers.ts      ← Generate, redeem vouchers
│   │   │   ├── users.ts         ← Profile, DMs, follows, notifications
│   │   │   └── manager.ts       ← Bar staff/manager endpoints
│   │   ├── services/
│   │   │   ├── geo.ts           ← Haversine distance calculation
│   │   │   └── push.ts          ← AWS Pinpoint push notifications
│   │   ├── workers/
│   │   │   ├── crowdUpdater.ts  ← Cron: crowd recalc every 5 min
│   │   │   └── voucherExpiry.ts ← Cron: expire vouchers
│   │   ├── lib/
│   │   │   └── prisma.ts        ← Prisma client singleton
│   │   └── types/index.ts       ← Shared TypeScript interfaces
│   ├── prisma/
│   │   ├── schema.prisma        ← 14 models, PostgreSQL
│   │   └── seed.ts              ← DB seeding script
│   ├── Dockerfile               ← Container build
│   └── package.json
├── mobile/                      ← React Native / Expo app
│   ├── app/                     ← Expo Router file-based routes (17 screens)
│   ├── components/ui/           ← 18 reusable UI components
│   ├── lib/                     ← API client + Socket wrapper
│   ├── constants/               ← Theme, mockData
│   ├── types/                   ← TypeScript types
│   ├── assets/                  ← Images, icons, fonts
│   ├── ios/, android/           ← Native build artifacts
│   ├── app.json                 ← Expo config
│   ├── tailwind.config.js       ← TailwindCSS config
│   ├── global.css               ← Global styles
│   └── package.json
├── web/                         ← Next.js marketing site
│   ├── src/app/                 ← Pages + API routes
│   ├── src/components/          ← 30+ UI + section components
│   ├── src/lib/                 ← Supabase, Resend, utils
│   └── package.json
├── design-system/               ← Stitch design system exports
├── docs/                        ← Documentation
└── .env.example                 ← Root environment variable template
```

---

## 4. Screen Inventory

| Screen | File Path | Purpose | Key Deps | State | Status |
|--------|-----------|---------|----------|-------|--------|
| Home | `mobile/app/(tabs)/index.tsx` | Bar list with crowd colors | BarCard, api.getBars | bars[], loading, refresh | Complete |
| Map | `mobile/app/(tabs)/map.tsx` | Mapbox map, bar pins, checkin | @rnmapbox/maps, api.postCheckin | bars[], selectedBar | Complete |
| Crawls | `mobile/app/(tabs)/crawls.tsx` | Crawl routes + progress | api.getCrawls | crawls[], progress | Complete |
| Camera Tab | `mobile/app/(tabs)/camera.tsx` | Tab entry for video | expo-camera | recording state | Complete |
| Collection | `mobile/app/(tabs)/collection.tsx` | Badge grid view | Badge, api.getBadges | badges[] | Complete |
| Profile | `mobile/app/(tabs)/profile.tsx` | User stats, highlights | Avatar, XPBar, api.getMe | user, stats | Complete |
| Bar Detail | `mobile/app/bar/[id].tsx` | Bar specials, videos, staff | GlassCard, api.getBar | bar, tab | Complete |
| DM Chat | `mobile/app/dms/[userId].tsx` | Direct messaging | api.getDMs | messages[], input | Unclear — real-time unclear |
| Auth / Login | `mobile/app/(auth)/index.tsx` | Sign in / sign up | expo-auth-session implied | authStep, form | Partial — Cognito wiring unclear |
| Onboarding | `mobile/app/(auth)/onboarding.tsx` | Intro slides | Animation | currentSlide | Complete (static) |
| Camera Modal | `mobile/app/camera.tsx` | Video recording modal | expo-camera | recording | Duplicate with tab? |
| Story Viewer | `mobile/app/story-viewer.tsx` | Ephemeral story playback | expo-av implied | story, progress | Unclear |
| Notifications | `mobile/app/notifications.tsx` | Notification list | api.getNotifications | notifications[] | Placeholder likely |
| Messages | `mobile/app/messages.tsx` | DM inbox | api.getDMs | conversations[] | Placeholder likely |
| Landing | `web/src/app/page.tsx` | Marketing page | All section components | none (static) | Complete |
| Waitlist API | `web/src/app/api/waitlist/route.ts` | Email capture | Supabase | — | Complete |
| Waitlist Count | `web/src/app/api/waitlist-count/route.ts` | Count display | Supabase | — | Complete |

---

## 5. Component Inventory

| Component | Used In | Props | Reusable | Needs Cleanup |
|-----------|---------|-------|----------|---------------|
| BarCard | Home tab | bar object, onPress | Yes | No |
| BarCardCompact | Crawls, Map | bar object | Yes | No |
| GlassCard | Bar detail, profile | children, style | Yes | No |
| Badge | Collection | badge object, rarity | Yes | No |
| BadgeCard | Collection, Bar detail | badge, earned | Yes | No |
| CrowdMeter | Home, Bar detail | level (0-99) | Yes | No |
| XPBar | Profile | current, max | Yes | No |
| Avatar | Profile, DMs | uri, size | Yes | No |
| Button | All screens | title, onPress, variant | Yes | No |
| AppBar | All screens | title, back | Yes | No |
| BottomSheet | Map, Bar detail | children, snapPoints | Yes | No |
| Toast | Global | message, type | Yes | Needs context provider |
| SkeletonLoader | All loading states | rows, type | Yes | No |
| StoryCircle | Home, Profile | user, hasNew | Yes | No |
| CameraButton | Camera screens | onPress, recording | Contextual | No |

---

## 6. State & Data Flow

### State Management
- **Pattern:** Local `useState` / `useEffect` per screen — no Redux, Zustand, or MobX
- **Auth token:** `expo-secure-store` (encrypted), cleared on 401
- **No shared global state** — each screen fetches its own data

### API Calls (all in `mobile/lib/api.ts`)
- `getBars()` → `GET /api/bars`
- `getBar(id)` → `GET /api/bars/:id`
- `postCheckin(payload)` → `POST /api/checkins`
- `getMe()` → `GET /api/auth/me`
- `getBadges()` → `GET /api/badges`
- `getCrawls()` → `GET /api/crawls`
- `getNotifications()` → `GET /api/users/notifications`
- `getDMs()` → `GET /api/users/dms`

### Real-time Data
- `lib/socket.ts` subscribes to `crowd:update` WebSocket events
- Updates bar crowd levels without full re-fetch

### Mock / Hardcoded Data
- `constants/mockData.ts` — development data (must be removed for production)
- BASE_URL hardcoded as `http://localhost:3000/api` in `lib/api.ts`
- Mapbox token currently empty in `app.json`

### Auth/Session Flow
1. User opens app → check SecureStore for token
2. No token → navigate to `(auth)/index.tsx`
3. Login → POST to Cognito → get JWT → store in SecureStore
4. POST `/api/auth/sync` → upsert user in DB
5. All subsequent requests: auto-inject Bearer token (lib/api.ts)
6. On 401: clear token → redirect to `(auth)`
7. Token refresh: **not explicitly implemented** — unclear from codebase

---

## 7. Backend Dependency Audit

| Service | What It Does | Where Referenced | Required | Status |
|---------|-------------|-----------------|----------|--------|
| **PostgreSQL** | Primary database | prisma/schema.prisma, lib/prisma.ts, all routes | Required | Implemented |
| **AWS Cognito** | Auth / identity | middleware/auth.ts, routes/auth.ts | Required | Implemented |
| **AWS S3** | Video/media storage | routes/videos.ts, backend env | Required | Partially — upload logic present, retrieval unclear |
| **AWS Pinpoint** | Push notifications | services/push.ts | Required | Partially — service exists, delivery unverified |
| **Socket.io** | Real-time crowd updates | index.ts, workers/crowdUpdater.ts | Required | Implemented |
| **Stripe** | Payments / subscriptions | backend/package.json | Optional | **Imported but no routes visible** |
| **Mapbox** | Map tiles + geocoding | mobile/app/(tabs)/map.tsx | Required | Implemented (token needed) |
| **Supabase** | Web waitlist storage | web/src/lib/supabase.ts | Web only | Implemented |
| **Resend** | Waitlist emails | web/src/lib/resend.ts | Web only | Implemented |
| **node-cron** | Scheduled jobs | workers/crowdUpdater.ts, voucherExpiry.ts | Required | Implemented |
| **Redis** | Caching / queuing | .env.example (`REDIS_URL`) | Optional | **Defined in env but not used in code** |
| **SendGrid** | Email (backend) | .env.example only | Optional | **Not wired — env only** |
| **Mailchimp** | Marketing | .env.example only | Optional | **Not wired — env only** |
| **Apple Sign In** | OAuth | .env.example only | Optional | **Not wired — env only** |
| **Google OAuth** | OAuth | .env.example only | Optional | **Not wired — env only** |
| **Facebook OAuth** | OAuth | .env.example only | Optional | **Not wired — env only** |

---

## 8. Environment & Config Audit

### Root `.env.example`

```env
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379         # Defined, not used in code

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
PINPOINT_APPLICATION_ID=

# Auth
JWT_SECRET=                              # Min 32 chars required
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Marketing (not wired)
SENDGRID_API_KEY=
MAILCHIMP_API_KEY=
MAILCHIMP_LIST_ID=
MAILCHIMP_SERVER_PREFIX=

# App config
PORT=3000
NODE_ENV=development
UPLOAD_DIR=uploads
MAX_VIDEO_SIZE_MB=100
CHECK_IN_RADIUS_FEET=300
```

### Mobile `mobile/.env`

```env
EXPO_PUBLIC_API_URL=http://localhost:3000    # MUST change for production
EXPO_PUBLIC_MAPBOX_TOKEN=pk.eyJ...          # Valid token present
```

### Web `web/.env.local.example`

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
FROM_EMAIL=
NEXT_PUBLIC_APP_URL=
```

### Config Files

| File | Location | Notes |
|------|----------|-------|
| `app.json` | `mobile/` | Expo config, plugins, iOS/Android settings, dark theme |
| `tailwind.config.js` | `mobile/` | NativeWind config |
| `babel.config.js` | `mobile/` | Expo Babel preset |
| `metro.config.js` | `mobile/app/` | Metro bundler with NativeWind |
| `next.config.ts` | `web/` | Next.js config |
| `tsconfig.json` | `backend/`, `web/` | TypeScript compiler options |
| `components.json` | `web/` | shadcn/ui config |
| `Dockerfile` | `backend/` | Container build for Express server |

### `package.json` Scripts

**Backend:**
```json
"build": "tsc",
"start": "node dist/index.js",
"dev": "ts-node-dev src/index.ts",
"test": "echo error"           // Placeholder — no tests
```

**Mobile:**
```json
"start": "expo start",
"android": "expo run:android",
"ios": "expo run:ios"
```

### Native Dependencies
- `@rnmapbox/maps` — requires Mapbox token in app.json/native config
- `expo-camera` — camera + microphone permissions (iOS/Android)
- `expo-secure-store` — iOS Keychain / Android Keystore
- `expo-location` — GPS access for check-in
- `@gorhom/bottom-sheet` — requires `react-native-reanimated` + `react-native-gesture-handler`

---

## 9. Risk & Problem Audit

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| 1 | `API_URL` hardcoded to `localhost:3000` | `mobile/lib/api.ts`, `mobile/.env` | **Critical** — will fail in any non-dev environment |
| 2 | WebSocket URL hardcoded to `ws://localhost:3000` | `mobile/lib/socket.ts` | **Critical** |
| 3 | No JWT token refresh logic | `mobile/lib/api.ts` | **High** — sessions will silently expire |
| 4 | `camera.tsx` exists at both `app/camera.tsx` and `app/(tabs)/camera.tsx` | `mobile/app/` | **High** — likely duplicate/conflicting routes |
| 5 | CORS set to `origin: '*'` | `backend/src/index.ts` | **High** — must restrict in production |
| 6 | Stripe imported in backend but zero routes wired | `backend/package.json` | **Medium** — dead import |
| 7 | Redis URL in env but never used | `.env.example` | **Medium** — workers hit DB directly; no queue |
| 8 | `constants/mockData.ts` — mock data in production path | `mobile/constants/` | **Medium** — must be stripped |
| 9 | No test suite anywhere | `backend/`, `mobile/`, `web/` | **Medium** |
| 10 | `notifications.tsx` and `messages.tsx` likely placeholders | `mobile/app/` | **Medium** |
| 11 | DM real-time — unclear if Socket.io handles DMs or only crowd | `mobile/app/dms/` | **Medium** |
| 12 | Story viewer — `expo-av` not listed in package.json | `mobile/app/story-viewer.tsx` | **Medium** |
| 13 | SendGrid, Mailchimp, Apple/Google/Facebook OAuth in env — not wired | `.env.example` | **Low** — not used yet |
| 14 | No structured logging or APM — only `console.error` | Backend-wide | **Low** |
| 15 | No React error boundaries | Mobile + Web | **Low** |
| 16 | `seed.ts` may not match current schema | `backend/prisma/seed.ts` | **Low** |
| 17 | Mapbox token empty in `app.json` (present in `.env`) | `mobile/app.json` | **Low** — env correctly set |

---

## 10. Deployment Readiness

| Component | Classification | Needs |
|-----------|---------------|-------|
| Web landing page (Next.js) | Frontend + serverless API | Vercel / Netlify, Supabase env vars |
| Mobile app (Expo) | Static binary | EAS Build, production API URL, Mapbox token |
| Backend Express server | **Needs a persistent server** | EC2 / ECS / Railway / Render |
| PostgreSQL database | **Needs a database** | RDS / Supabase / Railway |
| Socket.io (real-time) | **Needs a persistent server** (same as backend) | Must run alongside Express |
| File uploads (videos) | **Needs storage** | AWS S3 (already planned) |
| Push notifications | AWS managed | AWS Pinpoint — already wired |
| Auth | AWS managed | AWS Cognito — already wired |
| Cron workers (crowd, voucher) | **Needs persistent process** | Runs in Express process — needs keep-alive |
| Stripe payments | Not yet wired | Future work |
| Admin tools | Not yet built | Future work |

---

## 11. Cloud Migration Buckets

| Bucket | Components |
|--------|-----------|
| `static/frontend` | Web marketing site (Next.js) → Vercel |
| `managed backend` | Express API + Socket.io — needs always-on server |
| `database` | PostgreSQL (14 models) |
| `storage` | S3 (video uploads, story media) |
| `auth` | AWS Cognito — already AWS-managed |
| `cron/jobs` | crowdUpdater (5 min), voucherExpiry — embedded in Express |
| `notifications` | AWS Pinpoint (push) |
| `analytics` | Not yet implemented |
| `admin tools` | Not yet implemented |

---

## 12. Final Summary

### Current Architecture Summary
Three-part system: an Expo React Native mobile app (17 screens, gamified nightlife), a Next.js marketing/waitlist site, and a TypeScript Express API backed by PostgreSQL. Auth uses AWS Cognito + JWT. Media is routed to S3. Real-time crowd updates use Socket.io. Two cron workers run inside the Express process.

### What Already Exists
- Full mobile app with 17 screens, 18 components, complete navigation
- Express REST API with 9 route modules, fully typed
- PostgreSQL schema with 14 models covering all features
- AWS Cognito auth integration (middleware + routes)
- AWS Pinpoint push notification service
- S3 video upload wiring
- Real-time Socket.io crowd updates
- Cron workers for crowd recalc and voucher expiry
- Next.js marketing site with working waitlist (Supabase + Resend)
- Dockerfile for backend container
- Full design token system

### What Is Missing
- JWT token refresh logic (mobile)
- Mobile production API URL (hardcoded to localhost)
- Stripe payment routes (package imported, zero routes exist)
- Test suite (placeholder scripts everywhere)
- Error boundaries (mobile + web)
- Structured logging / APM
- Redis usage (in env, never wired)
- DM real-time wiring (unclear if Socket.io covers DMs)
- Story playback (expo-av not in package.json)
- Social OAuth (Apple, Google, Facebook — env only)
- Proper CORS origin list
- EAS build config (not audited)

### What Can Move Off Local Immediately
- Web landing site → **Vercel** (zero config, free tier, auto-deploys)
- Mobile app binary → **Expo EAS Build** (free tier, no local machine required)
- Supabase waitlist DB → already cloud-hosted

### What Needs AWS or Another Cloud Service
- **Express backend + Socket.io** → EC2 t3.small / ECS Fargate / Railway / Render (cheapest: Railway ~$5/mo or Render free tier)
- **PostgreSQL** → RDS t3.micro ($15/mo) or Railway Postgres ($5/mo) or Neon (generous free tier)
- **AWS Cognito** → already AWS (free for <50k users/month)
- **AWS S3** → already planned (pay per GB, minimal cost early on)
- **AWS Pinpoint** → already AWS (free for <1M push/month)

### Biggest Cost Risks
1. **EC2/ECS for Express server** — if not rightsized, this is the largest fixed cost
2. **RDS PostgreSQL** — if using RDS, t3.micro is ~$15-25/mo; alternatives like Neon/Railway are cheaper at small scale
3. **S3 video storage** — 100 MB max per video; 1,000 videos = 100 GB; ~$2.30/mo storage but egress costs add up
4. **Mapbox** — generous free tier (50k map loads/mo), watch for spikes
5. **No caching layer (Redis)** — at scale, DB hit on every request; `REDIS_URL` is in env but unused

### Recommended Next Step After This Audit
1. Fix the two **Critical** issues first: set `EXPO_PUBLIC_API_URL` to a real URL, fix WebSocket URL
2. Deploy **web site to Vercel** immediately (free, zero risk, no backend needed)
3. Deploy **backend to Railway or Render** with a managed Postgres add-on (~$5-10/mo total)
4. Run `prisma migrate deploy` against the new DB and smoke-test all 9 route modules
5. Update mobile EAS build with production API URL + Mapbox token
6. Then plan CI/CD pipeline (GitHub Actions → EAS build trigger + server deploy)

---

## Appendix: Feature-to-Backend Dependency Matrix

| Feature | Routes | DB Models | AWS Services | Real-time |
|---------|--------|-----------|-------------|----------|
| Check-in | POST /checkins | CheckIn, Bar, User, Badge | — | Socket.io (crowd emit) |
| Badge collection | GET /badges | Badge, UserBadge | — | — |
| Bar crawls | GET /crawls | CrawlRoute, CrawlStop, CrawlProgress | — | — |
| Video upload | POST /videos | Video | S3 | — |
| Stories | (unclear) | Story | S3 | — |
| Vouchers | GET/POST /vouchers | Voucher | — | — |
| DMs | GET /users/dms | (unclear — no DM model in schema) | — | Unclear |
| Notifications | GET /users/notifications | (no Notification model visible) | Pinpoint | — |
| Bar manager | /manager/* | Bar, BarStaff | — | — |
| Auth | POST /auth/sync | User | Cognito | — |
| Crowd levels | (worker) | Bar, CheckIn | — | Socket.io |
| Push notifications | (services/push.ts) | User.pushToken | Pinpoint | — |
| Waitlist | web/api/waitlist | Supabase table | — | — |
| Payments | (not built) | (no Payment model) | Stripe | — |

---

*Audit complete. No files modified. Based entirely on source files read from /Users/gabrielonyijen/charm-city-nights.*
