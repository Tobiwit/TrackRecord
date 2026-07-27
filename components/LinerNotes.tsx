"use client";

import Link from "next/link";
import { PersonAvatar } from "./Avatar";
import { MoodIcon } from "./MoodIcon";
import { accent } from "@/lib/colors";
import { formatShortDate } from "@/lib/format";
import { mood } from "@/lib/moods";
import { standardEvent } from "@/lib/events";
import { postDate } from "@/lib/types";
import {
  describeDuration,
  formatRelevanceRange,
  isPlayable,
  statusLabel,
  type Storyline,
} from "@/lib/record";

/**
 * The sleeve insert. Whatever groove is hovered, focused or selected, this is
 * where the actual reading happens — dates, the song, the last thing that was
 * written down, and the handful of entries that mattered.
 */
export function LinerNotes({ storyline, playing }: { storyline: Storyline; playing: boolean }) {
  const { person, posts, highlights, latestSong } = storyline;
  const color = accent(person.color);
  const latest = posts[posts.length - 1];
  const written = latest.text?.trim() || latest.title?.trim();
  const moods = topMoods(storyline);

  return (
    <aside
      key={person.id}
      className="paper liner-notes relative rounded-sm p-5 md:p-6 pb-7"
      style={{ transform: "rotate(-0.35deg)" }}
      aria-live="polite"
    >
      <span className="tape -top-2.5 left-7 rotate-[-5deg]" aria-hidden />
      <span className="tape -top-2.5 right-9 rotate-[3.5deg]" aria-hidden />
      <span
        className="absolute inset-2.5 border pointer-events-none"
        style={{ borderColor: `${color.hex}44` }}
        aria-hidden
      />

      <div className="relative">
        <p className="font-type text-[10px] tracking-[0.2em] uppercase text-sepia">liner notes</p>

        {/* ---- who ---- */}
        <div className="flex items-center gap-3 mt-2">
          <PersonAvatar person={person} size={46} />
          <div className="min-w-0">
            <h2 className="font-title text-2xl md:text-[1.7rem] leading-none text-ink truncate">
              {person.name}
            </h2>
            {person.nickname && (
              <p className="font-hand text-lg text-sepia leading-tight mt-0.5">
                “{person.nickname}”
              </p>
            )}
          </div>
        </div>

        {/* ---- when, how long, where it stands ---- */}
        <dl className="mt-4 border-t border-b border-dashed ink-line py-2.5 space-y-1">
          <Row label="relevant">{formatRelevanceRange(storyline.first, storyline.last, storyline.active)}</Row>
          <Row label="duration">
            for {describeDuration(storyline.last - storyline.first)}
            {storyline.periods.length > 1 && (
              <span className="text-ink-soft"> · in {storyline.periods.length} stretches</span>
            )}
          </Row>
          <Row label="status">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full ring-1 ring-ink/30"
                style={{ background: color.hex }}
                aria-hidden
              />
              {statusLabel(storyline)}
            </span>
          </Row>
          {person.eraTitle && (
            <Row label="pressed as">
              <span className="font-heading text-ink">{person.eraTitle}</span>
            </Row>
          )}
        </dl>

        {/* ---- the song ---- */}
        {latestSong && (
          <div className="mt-3.5 flex items-start gap-3">
            <SongArt url={latestSong.albumArtUrl} color={color.hex} />
            <div className="min-w-0 flex-1">
              <p className="font-type text-[10px] tracking-[0.18em] uppercase text-sepia">
                latest track
              </p>
              <p className="font-heading text-[17px] text-ink leading-snug">{latestSong.title}</p>
              <p className="text-sm text-ink-soft italic">{latestSong.artist}</p>
              {!isPlayable(latestSong) ? (
                <p className="font-hand text-base text-sepia leading-none mt-1">
                  no preview — vibe along
                </p>
              ) : (
                playing && (
                  <p className="font-hand text-base text-sepia leading-none mt-1">♪ spinning now</p>
                )
              )}
            </div>
          </div>
        )}

        {/* ---- what was actually written down ---- */}
        {written && (
          <blockquote className="mt-4">
            <p className="text-[15px] text-ink italic leading-snug">“{written}”</p>
            <footer className="font-hand text-base text-sepia leading-none mt-1">
              — the last entry, {formatShortDate(postDate(latest))}
            </footer>
          </blockquote>
        )}
        {moods && (
          <p className="font-type text-[11px] text-sepia mt-2 leading-relaxed">
            reads {moods}.
          </p>
        )}

        {/* ---- the tracklist ---- */}
        <div className="mt-4">
          {/* the accent lives in the rule, not the type — several of the palette's
              colors don't clear 4.5:1 as 10px text on paper */}
          <p
            className="font-type text-[10px] uppercase tracking-[0.22em] text-sepia border-b border-dashed pb-1"
            style={{ borderColor: `${color.hex}88` }}
          >
            {highlights.length === posts.length ? "the entries" : "selected entries"}
          </p>
          <ol className="mt-2 space-y-1.5">
            {highlights.map((po, i) => {
              const event = po.eventType ? standardEvent(po.eventType) : undefined;
              return (
                <li key={po.id} className="flex items-baseline gap-2">
                  <span className="font-type text-[11px] text-sepia shrink-0 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-type text-sepia/60 shrink-0" aria-hidden>
                    —
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-heading text-[15px] text-ink leading-snug">
                      {event?.label ?? po.title}
                    </span>
                    <span className="block font-type text-[10px] text-sepia mt-0.5">
                      {formatShortDate(postDate(po))}
                      {event && <span className="text-ink-soft"> · {po.title}</span>}
                    </span>
                  </span>
                  <span className="text-espresso shrink-0" title={mood(po.moodIcon).label}>
                    <MoodIcon moodKey={po.moodIcon} className="w-3.5 h-3.5" />
                  </span>
                </li>
              );
            })}
          </ol>
          {posts.length > highlights.length && (
            <p className="font-hand text-base text-sepia mt-1.5 leading-none">
              and {posts.length - highlights.length} more in the full story
            </p>
          )}
        </div>

        {/* ---- out to the feed ---- */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href={`/me?person=${person.id}`}
            className="btn-vintage rounded-sm px-4 py-2 inline-block"
          >
            Read every entry about {person.name}
          </Link>
          {!person.active && person.eraTitle && (
            <Link
              href={`/era/${person.id}`}
              className="text-sm underline text-espresso hover:text-burgundy"
            >
              view the record ♪
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}

/** Nothing has been written yet — the record is blank. */
export function EmptyLinerNotes() {
  return (
    <aside className="paper relative rounded-sm p-6 md:p-7" style={{ transform: "rotate(-0.4deg)" }}>
      <span className="tape -top-2.5 left-8 rotate-[-4deg]" aria-hidden />
      <p className="font-type text-[10px] tracking-[0.2em] uppercase text-sepia">liner notes</p>
      <h2 className="font-title text-2xl text-ink mt-2">A blank pressing.</h2>
      <p className="font-hand text-xl text-sepia mt-1.5 leading-snug">
        Nothing has been cut into this record yet.
        <br />
        Suspiciously quiet, honestly.
      </p>
      <p className="text-[15px] text-ink-soft italic mt-3">
        Add someone to the cast and write an entry — the grooves fill themselves in.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link href="/new" className="btn-vintage rounded-sm px-4 py-2 inline-block">
          + Add to the lore
        </Link>
        <Link href="/people" className="text-sm underline text-espresso hover:text-burgundy">
          the cast
        </Link>
      </div>
    </aside>
  );
}

/* ---------- bits ---------- */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="font-type text-[10px] uppercase tracking-[0.14em] text-sepia w-[4.6rem] shrink-0">
        {label}
      </dt>
      <dd className="text-sm text-ink-soft min-w-0">{children}</dd>
    </div>
  );
}

function SongArt({ url, color }: { url?: string; color: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="w-14 h-14 shrink-0 object-cover border border-ink/30 shadow-[1px_2px_4px_rgba(46,32,21,0.22)]"
      />
    );
  }
  // no artwork: a small pressed label, same fallback the record itself uses
  return (
    <svg viewBox="0 0 56 56" className="w-14 h-14 shrink-0" aria-hidden>
      <rect width="56" height="56" fill="#211b15" />
      <circle cx="28" cy="28" r="21" fill="none" stroke="rgba(240,230,210,0.16)" strokeWidth="0.8" />
      <circle cx="28" cy="28" r="16" fill="none" stroke="rgba(240,230,210,0.12)" strokeWidth="0.8" />
      <circle cx="28" cy="28" r="11" fill={color} opacity="0.92" />
      <circle cx="28" cy="28" r="11" fill="none" stroke="rgba(20,16,11,0.5)" strokeWidth="0.8" />
      <circle cx="28" cy="28" r="1.8" fill="#14100b" />
    </svg>
  );
}

/**
 * A plain description of the moods on record — no invented commentary.
 * Only moods that recur say anything; on a short storyline where every entry
 * has its own mood, the percentages are noise, so the line is left out.
 */
function topMoods(s: Storyline): string | null {
  if (s.posts.length < 4) return null;
  const counts = new Map<string, number>();
  for (const p of s.posts) counts.set(p.moodIcon, (counts.get(p.moodIcon) ?? 0) + 1);
  const recurring = [...counts.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
  if (recurring.length === 0) return null;
  return recurring
    .slice(0, 3)
    .map(([key, n]) => `${Math.round((n / s.posts.length) * 100)}% ${mood(key).label}`)
    .join(" · ");
}
