import type { Person, Post, Song } from "./types";
import { postDate } from "./types";

/**
 * Visualization logic for the record overview page (/record).
 *
 * Pure functions only — no React, no DOM. Everything the vinyl draws (which
 * storylines make the cut, which ring they sit on, where their arcs start and
 * end) is derived here so the dates and durations can be reasoned about and
 * tested independently of the SVG.
 */

const DAY = 86_400_000;

/** How many concentric interactive rings the record carries at most. */
export const MAX_STORYLINES = 8;

/**
 * A silence longer than this between two updates reads as "they disappeared",
 * and splits the storyline into two separate arcs on the same ring.
 *
 * The schema has no explicit relevance periods yet; when it grows them, swap
 * `derivePeriods` for the stored value — nothing else here changes.
 */
export const RETURN_GAP_DAYS = 42;

/** Active people get this much of a nudge when deciding who makes the record. */
const ACTIVE_BONUS_DAYS = 14;

/* ---------- geometry constants (1000 × 1000 user units) ---------- */

export const VIEW = 1000;
export const CENTER = VIEW / 2;
/** Outer edge of the vinyl itself. */
export const R_DISC = 480;
/** The paper label / album artwork in the middle. */
export const R_LABEL = 142;
/** Interactive rings live between these radii. */
export const R_BAND_INNER = 216;
export const R_BAND_OUTER = 452;
/** Rings never spread further apart than this, so two people still read as a pair. */
const MAX_PITCH = 50;

/** 12 o'clock. SVG angles run clockwise from 3 o'clock, so noon is -90°. */
export const START_ANGLE = -90;
/** Just short of a full turn, so the earliest and latest dates stay distinct. */
export const SWEEP_DEGREES = 340;
/** Even a one-day storyline stays hoverable. */
export const MIN_ARC_DEGREES = 7;

/* ---------- types ---------- */

export interface RelevancePeriod {
  start: number;
  end: number;
}

export interface Storyline {
  person: Person;
  /** Every update about this person, oldest first. */
  posts: Post[];
  first: number;
  last: number;
  /** Still being written — the arc runs to today. */
  active: boolean;
  periods: RelevancePeriod[];
  latestSong: Song | null;
  latestSongPost: Post | null;
  /** 3–5 updates worth putting in the liner notes, oldest first. */
  highlights: Post[];
}

export interface TrackArc {
  start: number;
  end: number;
  /** Degrees swept — used to decide whether a label fits. */
  span: number;
}

export interface VinylTrack {
  storyline: Storyline;
  /** Ring radius; index 0 is innermost and holds the newest storyline. */
  radius: number;
  arcs: TrackArc[];
  /** Distance between neighbouring rings, in user units. */
  pitch: number;
}

/* ---------- storylines ---------- */

/** Split a run of update dates wherever the person went quiet for a long while. */
export function derivePeriods(
  dates: number[],
  { active, now, gapDays = RETURN_GAP_DAYS }: { active: boolean; now: number; gapDays?: number }
): RelevancePeriod[] {
  if (dates.length === 0) return [];
  const gap = gapDays * DAY;
  const periods: RelevancePeriod[] = [];
  let start = dates[0];
  let prev = dates[0];

  for (const d of dates.slice(1)) {
    if (d - prev > gap) {
      periods.push({ start, end: prev });
      start = d;
    }
    prev = d;
  }
  periods.push({ start, end: prev });

  // an ongoing storyline runs all the way to today
  if (active) periods[periods.length - 1].end = Math.max(prev, now);
  return periods;
}

/** The 3–5 updates that carry the story: the opener, the closer, the milestones. */
export function pickHighlights(posts: Post[], limit = 5): Post[] {
  if (posts.length <= limit) return posts;

  const first = posts[0];
  const last = posts[posts.length - 1];
  const chosen = new Set<Post>([first, last]);

  // marked milestones (event stamps) beat freeform updates, newest first
  for (let i = posts.length - 1; i >= 0 && chosen.size < limit; i--) {
    if (posts[i].type === "standard_event") chosen.add(posts[i]);
  }
  // still short? fall back to the most recent updates
  for (let i = posts.length - 1; i >= 0 && chosen.size < limit; i--) chosen.add(posts[i]);

  return [...chosen].sort((a, b) => postDate(a) - postDate(b));
}

/**
 * Every person who has at least one update, newest storyline first.
 * `posts` may be in any order and may include other people's entries.
 */
export function buildStorylines(people: Person[], posts: Post[], now: number): Storyline[] {
  const out: Storyline[] = [];

  for (const person of people) {
    const own = posts
      .filter((p) => p.personIds.includes(person.id))
      .sort((a, b) => postDate(a) - postDate(b));
    if (own.length === 0) continue;

    const dates = own.map(postDate);
    const first = dates[0];
    const last = dates[dates.length - 1];
    const latestSongPost = [...own].reverse().find((p) => p.song?.title) ?? null;

    out.push({
      person,
      posts: own,
      first,
      last,
      active: person.active,
      periods: derivePeriods(dates, { active: person.active, now }),
      latestSong: latestSongPost?.song ?? null,
      latestSongPost,
      highlights: pickHighlights(own),
    });
  }

  return out.sort((a, b) => b.last - a.last);
}

/**
 * Trim to the storylines that belong on the record.
 *
 * Ranking prefers people who are still active, then whoever was relevant most
 * recently. The returned order is strictly by recency so the ring order always
 * reads as "innermost = now, outward = older".
 */
export function selectStorylines(all: Storyline[], limit = MAX_STORYLINES): Storyline[] {
  return [...all]
    .sort((a, b) => rank(b) - rank(a))
    .slice(0, limit)
    .sort((a, b) => b.last - a.last);
}

function rank(s: Storyline): number {
  return s.last + (s.active ? ACTIVE_BONUS_DAYS * DAY : 0);
}

/* ---------- geometry ---------- */

/** Ring radii, innermost first, centred inside the interactive band. */
export function ringRadii(count: number): number[] {
  if (count <= 0) return [];
  const band = R_BAND_OUTER - R_BAND_INNER;
  const pitch = count > 1 ? Math.min(MAX_PITCH, band / (count - 1)) : 0;
  const span = pitch * (count - 1);
  const start = R_BAND_INNER + (band - span) / 2;
  return Array.from({ length: count }, (_, i) => start + i * pitch);
}

/** Gap between neighbouring rings — drives stroke widths and label offsets. */
export function ringPitch(count: number): number {
  if (count <= 1) return MAX_PITCH;
  return Math.min(MAX_PITCH, (R_BAND_OUTER - R_BAND_INNER) / (count - 1));
}

/** The chronological scale shared by every ring: earliest date at 12 o'clock. */
export function makeTimeScale(domainStart: number, domainEnd: number) {
  const span = Math.max(1, domainEnd - domainStart);
  return (t: number) =>
    START_ANGLE + (clamp(t, domainStart, domainEnd) - domainStart) * (SWEEP_DEGREES / span);
}

/** The full time range the displayed storylines cover. */
export function storylineDomain(storylines: Storyline[], now: number): [number, number] {
  if (storylines.length === 0) return [now - 30 * DAY, now];
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of storylines) {
    for (const p of s.periods) {
      if (p.start < lo) lo = p.start;
      if (p.end > hi) hi = p.end;
    }
  }
  // a single-day history would divide by zero — give it a day of breathing room
  if (hi - lo < DAY) hi = lo + DAY;
  return [lo, hi];
}

/**
 * Lay the selected storylines out as rings of arcs.
 * Every ring shares one scale, so arcs can be compared across people.
 */
export function buildTracks(storylines: Storyline[], now: number): VinylTrack[] {
  const radii = ringRadii(storylines.length);
  const pitch = ringPitch(storylines.length);
  const [lo, hi] = storylineDomain(storylines, now);
  const toAngle = makeTimeScale(lo, hi);
  const maxAngle = START_ANGLE + SWEEP_DEGREES;

  return storylines.map((storyline, i) => ({
    storyline,
    radius: radii[i],
    pitch,
    arcs: storyline.periods.map((period) => {
      const start = toAngle(period.start);
      // short storylines keep a minimum visible length; long ones are already
      // capped by the scale, which never reaches a full turn
      const end = Math.min(maxAngle, Math.max(toAngle(period.end), start + MIN_ARC_DEGREES));
      return { start, end, span: end - start };
    }),
  }));
}

/** SVG path for an arc of `r` from `a0`° to `a1`°, drawn clockwise. */
export function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const sweep = a1 - a0;
  // a full circle can't be expressed as one arc — draw it as two halves
  if (sweep >= 359.999) {
    const p0 = polar(cx, cy, r, a0);
    const p1 = polar(cx, cy, r, a0 + 180);
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 1 1 ${p1.x} ${p1.y} A ${r} ${r} 0 1 1 ${p0.x} ${p0.y}`;
  }
  const from = polar(cx, cy, r, a0);
  const to = polar(cx, cy, r, a1);
  return `M ${from.x} ${from.y} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${to.x} ${to.y}`;
}

/**
 * The same arc drawn the other way round. Text on a clockwise path hangs off
 * its outer edge, which reads upside down once the arc passes 3 o'clock — a
 * reversed path puts those labels back on their feet.
 */
export function arcPathReversed(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const from = polar(cx, cy, r, a1);
  const to = polar(cx, cy, r, a0);
  return `M ${from.x} ${from.y} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 0 ${to.x} ${to.y}`;
}

/** True when the arc's midpoint sits in the bottom half of the record. */
export function arcRunsUnderside(a0: number, a1: number): boolean {
  return Math.sin((((a0 + a1) / 2) * Math.PI) / 180) > 0;
}

export function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Arc length in user units — how much room a groove label has to sit in. */
export function arcLength(radius: number, spanDegrees: number): number {
  return (radius * spanDegrees * Math.PI) / 180;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

/* ---------- copy helpers ---------- */

/** "Mar 4 – May 22, 2026" · "Nov 3, 2025 – Feb 8, 2026" · "Mar 4 – present" */
export function formatRelevanceRange(first: number, last: number, active: boolean): string {
  const f = new Date(first);
  const l = new Date(last);
  const monthDay = { month: "short", day: "numeric" } as const;
  const withYear = { ...monthDay, year: "numeric" } as const;

  if (active) {
    const thisYear = f.getFullYear() === new Date().getFullYear();
    return `${f.toLocaleDateString("en-US", thisYear ? monthDay : withYear)} – present`;
  }
  if (f.getFullYear() === l.getFullYear()) {
    return `${f.toLocaleDateString("en-US", monthDay)} – ${l.toLocaleDateString("en-US", withYear)}`;
  }
  return `${f.toLocaleDateString("en-US", withYear)} – ${l.toLocaleDateString("en-US", withYear)}`;
}

/** "9 days" · "7 weeks" · "4 months" · "1.4 years" */
export function describeDuration(ms: number): string {
  const days = Math.max(1, Math.round(ms / DAY));
  if (days < 14) return `${days} ${days === 1 ? "day" : "days"}`;
  const weeks = Math.round(days / 7);
  if (weeks < 10) return `${weeks} weeks`;
  const months = Math.round(days / 30.44);
  if (months < 24) return `${months} months`;
  return `${(days / 365.25).toFixed(1)} years`;
}

/** Where this storyline stands, in the app's own vocabulary. */
export function statusLabel(s: Storyline): string {
  if (s.person.active) return "still in rotation";
  if (s.person.eraTitle) return "pressed & shelved";
  return "archived";
}

/** Songs come from different snapshots, so compare by what they are. */
export function sameSong(a: Song | null | undefined, b: Song | null | undefined): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.spotifyId && b.spotifyId) return a.spotifyId === b.spotifyId;
  return a.title === b.title && a.artist === b.artist;
}

/** A song is only truly playable when there's a preview or a Spotify track. */
export function isPlayable(song: Song | null | undefined): boolean {
  return Boolean(song && (song.previewUrl || song.spotifyId));
}

/** Screen-reader sentence for one groove. */
export function grooveLabel(s: Storyline): string {
  const who = s.person.nickname ? `${s.person.name}, ${s.person.nickname}` : s.person.name;
  const range = formatRelevanceRange(s.first, s.last, s.active);
  const duration = describeDuration(s.last - s.first);
  const song = s.latestSong ? `, latest song ${s.latestSong.title} by ${s.latestSong.artist}` : "";
  return `${who}, relevant ${range}, ${duration}${song}.`;
}
