# Track Record

> *you could write songs about this bs*

A private, friend-group dating archive. Every update is a timeline entry, every entry gets a song, and every friend's dating life becomes a stacked "spire" of scrapbook cards — a 70s-flavored, Stevie-Nicks-energy emotional soundtrack.

## Features

- **Login / signup** with a zero-config fallback test account: **`test` / `admin`**
- **Home gallery** — friends' timelines as vertical card spires, newest entry on top; friends with unseen updates surface first; horizontal scroll on desktop, swipe on mobile
- **My Track Record** — your own full timeline
- **People ("the cast")** — everyone the songs are about, each with an accent color and a stylized (never photographic) avatar
- **New Update wizard** — pick person → entry type (freeform diary page or standardized event stamp: *First kiss*, *Red flag*, *Situationship detected*, …) → **required song** → words → mood icon → publish
- **Two-at-once stacks** — when a timeline features two people, entries lean left/right by person with per-person colors
- **Timeline detail pages** with filters (person, entry type, mood) and order toggle
- **Entry detail modal** — scrapbook page with the song, play/preview, friend reactions (*"screaming"*, *"no babe"*, *"iconic"*, …) and comments
- **Friends** — search, invite, accept/decline, remove; timelines are visible to accepted friends only
- **Music everywhere** — hovering the top card of a spire spins the vinyl and cues the song; a now-playing bar keeps spinning while you browse
- **Seeded demo data** so the app looks alive from the first run

## Tech

- [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Local-first data layer (`lib/db.ts`): everything persists to `localStorage`, seeded with demo data — no backend required to run or deploy
- Spotify search proxy route (`app/api/spotify/search`) that activates automatically when credentials are configured; otherwise an original mock catalog is used

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 and log in with:

```txt
username: test
password: admin
```

You'll land in a seeded world: June (two-people mess), Margot (the promising one), Carmen (the dramatic ending), plus your own partially-filled stack. A pending friend invite from Priya is waiting on the Friends page.

## Environment variables (all optional)

Copy `.env.example` to `.env.local`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Enables real Spotify song search (client-credentials flow). Create an app at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard). |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Switches the app from local demo mode to a real shared Supabase backend (see "Going live with Supabase"). |

Without Spotify credentials the app uses its in-house mock catalog — search still works, vinyls still spin, nothing blocks.

**Spotify gotchas (learned the hard way):**

- **Restart the dev server after editing `.env.local`** — Next.js reads env files at startup only, and `NEXT_PUBLIC_*` values are inlined at compile time.
- **Search results are capped at 10.** Development-mode Spotify apps reject `limit` values above 10 with `400 Invalid limit`.
- **`preview_url` is always `null` for apps created after Nov 2024** — Spotify removed direct 30-second preview audio from the Web API. Playback therefore uses Spotify's **embedded player** (rendered on entries, in the song picker, and in the now-playing bar): everyone gets a 30-second preview, and browsers logged into Spotify get the full track. No user OAuth needed.

## Going live with Supabase

Without Supabase env vars the app runs in **local demo mode**: every browser gets its own private, seeded localStorage world (great for trying the app, useless for actually sharing with friends). To make it a real multi-user app:

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. In **Settings → API Keys**, copy the **Project URL** and the **Publishable key** (newer projects show `sb_publishable_…` instead of the legacy "anon" key — either works).
3. In **Authentication → Sign In / Up → Email**, turn **off "Confirm email"** (or leave it on and let users confirm via the emailed link before logging in).
4. Open the **SQL editor**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates all tables, helper functions, and the row-level-security policies that enforce the friends-only boundary server-side.
5. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (restart the dev server) and in Vercel → Settings → Environment Variables (redeploy).

The app detects the env vars and switches automatically: real signup/login (the `test/admin` fallback disappears), friend search queries the database, and every mutation is applied optimistically then mirrored to Supabase. Friends' new posts are pulled in on login and whenever the tab regains focus.

## Architecture notes

- **`lib/db.ts` is the single data boundary.** Every screen reads through `useStore()` and mutates through exported functions (`createPost`, `sendFriendRequest`, …). It has two backends: localStorage (demo) and Supabase (`lib/remote.ts` + `lib/supabase.ts`), selected by env vars at build time. The entity shapes in `lib/types.ts` map 1:1 to the tables in `supabase/schema.sql`.
- **`lib/spotify.ts`** picks real search vs. mock catalog at call time.
- **Privacy by design:** uploaded photos of dating subjects are never rendered; `components/Avatar.tsx` generates consistent stylized vintage avatars (accent color + ink motif + initial) instead.
- **Demo reset:** Settings → "reset demo data" restores the seeded state.

## Deploying to Vercel

The app is a standard Next.js project with no required env vars:

1. Push to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new) — defaults work as-is.
3. (Optional) add the Spotify env vars in Project Settings → Environment Variables.

## Data model

`User`, `FriendRequest`, `Person`, `Post` (with embedded `Song`), `Comment`, `Reaction` — see [`lib/types.ts`](lib/types.ts). Posts always carry a song; `visibility` is `"friends"` for everything.

## Project structure

```
app/            pages (login, signup, home, me, new, people, friends, settings, u/[username])
app/api/        Spotify search proxy
components/     Shell, Spire, Timeline, EntryModal, SongPicker, Player, Avatar, Vinyl, MoodIcon
lib/            types, db (data layer), seed, songs, spotify, moods, events, reactions, colors, format
```
