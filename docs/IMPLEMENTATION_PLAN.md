# Charm City Nights — Implementation plan

This document merges **product/engineering roadmap**, **how to execute with Claude**, **Expo Router + Reanimated crash diagnosis**, and **swarm-based research** so one place drives implementation.

---

## Part A — Product and API roadmap (summary)

**Goal:** Replace mocks with live APIs, env-based config, hardened realtime, and optional leaderboard/stories.

| Phase | Focus |
|--------|--------|
| **A** | `EXPO_PUBLIC_*` API and WebSocket URLs; no hardcoded `localhost` in release paths; LAN for physical devices |
| **B** | Crawls + vouchers from backend; badges/collection from API with visible errors; profile from `getMe` |
| **C** | Stories: read path first (list + viewer), then upload if scoped |
| **D** | Socket: `socket.io-client` + JWT auth **or** harden custom client (reconnect, rooms) |
| **E** | CORS tightening via env; validation on new routes |

**Key files:** `mobile/lib/api.ts`, `mobile/lib/socket.ts`, `backend/prisma/schema.prisma`, `backend/src/index.ts`, screens under `mobile/app/`.

---

## Part B — Recommendations for Claude and agents

1. **Chunk work** — Run Phase A, then B, then C in separate sessions. Large single prompts increase bad diffs.
2. **Project knowledge** — Store “Constraints” and repo layout in Claude Project instructions so you do not repeat them.
3. **Point agents at the workspace** — Explicit root: `charm-city-nights`; mobile changes under `mobile/`.
4. **Verify after each phase** — `npx tsc --noEmit` in `mobile/`; backend `/health`; test on a real device when URLs change.
5. **Scope stories carefully** — If time is short: “GET list + viewer only; no upload in this PR.”
6. **Secrets** — Never commit `.env`; use placeholders in `.env.example` only.

---

## Part C — Expo Router crash: primary vs secondary symptoms

### What you likely see

- **Primary:** `ERROR [Error: Exception in HostFunction: <unknown>]` with stack pointing at **`<global> (app/(auth)/index.tsx:16)`** — often the line where `react-native-reanimated` is imported.
- **Secondary:** Many warnings such as “missing required default export,” “No route named `bar/[id]` exists,” “No route named `camera` exists,” etc.

### Why secondary warnings appear

If **any** route file **throws while the module loads** (before React renders), Expo Router may fail to register routes correctly. A broken import in `app/(auth)/index.tsx` can make **unrelated** routes look missing. Treat those warnings as **downstream** until the first crash is fixed.

### Likely failure chain

1. `app/(auth)/index.tsx` imports Reanimated (or runs bad top-level code).
2. Reanimated / native worklets setup is wrong or versions mismatch Expo SDK.
3. File throws during import.
4. Router does not finish registering routes.
5. Flood of “missing default export” / “route does not exist” warnings.

**Rough probability:** ~80% Reanimated or version/cache/native mismatch; ~15% bad top-level code in that file; ~5% multiple files genuinely missing default exports.

### Other possibilities (module scope)

- Animation/worklet APIs at module scope (not inside a component).
- `window` / `document` or native-only APIs at top level.
- Circular imports.

---

## Part D — Fast remediation (ordered)

### Step 1 — Confirm default export

`app/(auth)/index.tsx` must end with a **default** export of a React component (not only named exports).

### Step 2 — Isolate Reanimated (binary search)

Temporarily remove Reanimated from `app/(auth)/index.tsx`: comment the `import Animated, { ... } from 'react-native-reanimated'` and replace `Animated.View` with `View`. If the app loads, the problem is Reanimated setup (or usage at import time), not “missing routes.”

### Step 3 — Minimal safe route (sanity check)

Replace the auth index temporarily with:

```tsx
import { View, Text } from 'react-native';

export default function AuthIndex() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Auth Index Works</Text>
    </View>
  );
}
```

If this works, the router is fine; restore features incrementally.

### Step 4 — Align packages with Expo

```bash
cd mobile
npx expo install react-native-reanimated react-native-worklets
```

Use Expo’s installer so versions match the SDK.

### Step 5 — Babel / Metro

This repo uses `mobile/babel.config.js` with `babel-preset-expo` and `react-native-reanimated/plugin` **last in the plugins list** (required). If you migrate to worklets-first setup per upstream docs, compare with `react-native-worklets/plugin` and Expo’s current guidance — **do not duplicate plugins.**

### Step 6 — Clear caches and reinstall

```bash
cd mobile
rm -rf node_modules
# remove lockfile only if you intend to regenerate it
npx expo start --clear
npm install
```

For dev client / iOS native rebuild when needed:

```bash
npx expo run:ios
# or cd ios && pod install && cd ..
```

### Step 7 — Audit all route files

Each file under `mobile/app/` that defines a route must **default-export** a React component. Spot-check at least:

- `app/(auth)/index.tsx`, `app/(auth)/onboarding.tsx`
- `app/(tabs)/index.tsx`, `map.tsx`, `camera.tsx`, `crawls.tsx`, `collection.tsx`, `profile.tsx`
- `app/bar/[id].tsx`, `app/camera.tsx`, `app/story-viewer.tsx`, `app/notifications.tsx`, `app/messages.tsx`, `app/dms/[userId].tsx`

---

## Part E — Full Claude prompt: route-loading and Reanimated audit

Paste when you want a single agent to diagnose and fix:

```
Audit my Expo Router app for route-loading failures.

Focus first on app/(auth)/index.tsx because the crash may occur at the react-native-reanimated import line (stack: <global>).

Tasks:
1. Confirm app/(auth)/index.tsx has a valid default export.
2. Find any code that runs at module scope and could throw before render.
3. List every file under mobile/app/ that is a route and confirm default export.
4. Review mobile/babel.config.js for Expo + Reanimated/worklets compatibility (plugin order last).
5. Review mobile/package.json for expo, react-native-reanimated, and react-native-worklets version alignment with Expo SDK.
6. Propose exact fixes and, if needed, a minimal auth screen without Reanimated, then reintroduce animations safely.
7. Explain which warnings are likely secondary to the first import-time crash.
```

---

## Part F — Swarm init + parallel research (multiple angles)

Use this to **spawn several research/fix tracks** before merging one solution. Initialize once, then assign distinct questions to each agent so they do not duplicate work.

### 1) Initialize swarm (from repo root or `mobile/` per your CLI)

```bash
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

(Adjust flags to match your org’s claude-flow version.)

### 2) Parallel research tracks (one prompt per agent)

| Track | Mission |
|--------|---------|
| **R1 — Reanimated + Expo SDK** | Compare installed versions to Expo 54 compatibility matrix; list exact `expo install` commands and known breaking changes for `react-native-worklets` / Babel plugin names. |
| **R2 — Babel & Metro** | Read `babel.config.js` and Metro config; confirm Reanimated plugin is last; search for duplicate or conflicting plugins; recommend minimal diff. |
| **R3 — Import-time crash** | Trace `app/(auth)/index.tsx` for top-level side effects, circular imports, and any Reanimated API used outside components. |
| **R4 — Router registration** | Map `app/_layout.tsx` screens to files; verify file names match; document which warnings are secondary to auth crash. |
| **R5 — Native rebuild** | Document when `expo run:ios` / `pod install` is required vs cache-only fixes. |
| **R6 — Product roadmap** | Reconcile Part A with current `api.ts` mocks; prioritize Phase B vs crash fix (crash fix first). |

### 3) Merge policy

1. Fix **import-time crash** and Reanimated alignment first.  
2. Re-run the app and confirm secondary router warnings disappear or shrink.  
3. Then continue Part A–E product work.

---

## Part G — Master prompt (product + stability) for long sessions

Use when you want one document to cover both the roadmap and stability:

- Combine **Part A** (phases), **Part B** (execution rules), **Part C–D** (crash theory + steps), and **Part E** (audit tasks).  
- Add: “After router loads reliably, implement Phase A env config, then Phase B mock removal.”

---

## Changelog

- Merged product roadmap, Claude execution tips, Reanimated/Router diagnosis, remediation steps, audit prompt, and swarm research matrix.
