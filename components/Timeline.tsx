"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Person, Post, User } from "@/lib/types";
import { postDate } from "@/lib/types";
import { accent } from "@/lib/colors";
import { formatDate } from "@/lib/format";
import { MOODS, mood } from "@/lib/moods";
import { standardEvent } from "@/lib/events";
import { MoodIcon } from "./MoodIcon";
import { Vinyl } from "./Vinyl";
import { PersonAvatar, UserAvatar } from "./Avatar";
import { usePlayer } from "./Player";

const COL_TILT = [-0.6, 0.5, -0.4, 0.6];

/**
 * Full vertical timeline with filters — the detail view behind each spire.
 *
 * Active people who appear in entries each get their own column (up to four
 * on desktop) with a named header. Archived people give their column up:
 * their entries stay in the flow as full-width rows, and their pressed-era
 * records are linked above the filters. Multi-person entries also span the
 * full width.
 */
export function Timeline({
  owner,
  posts,
  people,
  onOpenPost,
  headerExtra,
}: {
  owner: User;
  posts: Post[];
  people: Person[];
  onOpenPost: (p: Post) => void;
  headerExtra?: React.ReactNode;
}) {
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  const [personFilter, setPersonFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [moodFilter, setMoodFilter] = useState<string>("all");
  const { play, stop, song, playing } = usePlayer();

  const activePeople = people.filter((p) => p.active);
  const archivedWithPosts = people.filter(
    (p) => !p.active && posts.some((po) => po.personIds.includes(p.id))
  );

  // columns: active people who actually appear in entries, max four
  const columnPeople =
    personFilter === "all"
      ? activePeople.filter((p) => posts.some((po) => po.personIds.includes(p.id))).slice(0, 4)
      : [];
  const cols = columnPeople.length;
  const grid = cols >= 2;

  const filtered = useMemo(() => {
    let list = [...posts];
    if (personFilter !== "all") list = list.filter((p) => p.personIds.includes(personFilter));
    if (typeFilter !== "all") list = list.filter((p) => p.type === typeFilter);
    if (moodFilter !== "all") list = list.filter((p) => p.moodIcon === moodFilter);
    list.sort((a, b) => (order === "newest" ? postDate(b) - postDate(a) : postDate(a) - postDate(b)));
    return list;
  }, [posts, personFilter, typeFilter, moodFilter, order]);

  const usedMoods = Array.from(new Set(posts.map((p) => p.moodIcon)));

  /** column index for a post, or -1 for a full-width row */
  const colOf = (post: Post): number => {
    if (!grid || post.personIds.length !== 1) return -1;
    return columnPeople.findIndex((p) => p.id === post.personIds[0]);
  };

  return (
    <div className={`p-4 md:p-8 mx-auto ${cols >= 3 ? "max-w-6xl" : "max-w-4xl"}`}>
      {/* profile header */}
      <div className="flex items-center gap-4 flex-wrap">
        <UserAvatar user={owner} size={64} />
        <div className="min-w-0">
          <h2 className="font-title text-3xl md:text-4xl text-ink">{owner.displayName}</h2>
          <p className="text-sepia font-type text-xs tracking-wide">@{owner.username}</p>
        </div>
        {activePeople.length > 0 && (
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <span className="font-hand text-sepia text-xl rotate-[-2deg]">currently in the lore:</span>
            {activePeople.map((p) => (
              <span key={p.id} className="flex items-center gap-1" title={p.nickname ?? p.name}>
                <PersonAvatar person={p} size={26} />
                <span className="text-sm text-ink-soft italic">{p.name}</span>
              </span>
            ))}
          </div>
        )}
        {headerExtra}
      </div>

      {/* pressed records (archived eras) */}
      {archivedWithPosts.length > 0 && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="font-hand text-lg text-sepia rotate-[-1deg]">from the shelf:</span>
          {archivedWithPosts.map((p) => (
            <Link
              key={p.id}
              href={`/era/${p.id}`}
              className="flex items-center gap-1.5 paper-deep border border-ink/20 rounded-sm px-2 py-1 hover:border-ink/50 transition-colors"
            >
              <PersonAvatar person={p} size={20} />
              <span className="font-heading text-sm text-ink">
                {p.eraTitle?.trim() || `The ${p.name} Era`}
              </span>
              <span className="text-sepia text-xs" aria-hidden>♪</span>
            </Link>
          ))}
        </div>
      )}

      {/* filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        <select
          value={personFilter}
          onChange={(e) => setPersonFilter(e.target.value)}
          className="vintage rounded-sm px-2 py-1.5"
          aria-label="Filter by person"
        >
          <option value="all">everyone</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              about {p.name}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="vintage rounded-sm px-2 py-1.5"
          aria-label="Filter by post type"
        >
          <option value="all">all entries</option>
          <option value="update">freeform updates</option>
          <option value="standard_event">event stamps</option>
        </select>
        <select
          value={moodFilter}
          onChange={(e) => setMoodFilter(e.target.value)}
          className="vintage rounded-sm px-2 py-1.5"
          aria-label="Filter by mood"
        >
          <option value="all">every mood</option>
          {MOODS.filter((m) => usedMoods.includes(m.key)).map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setOrder(order === "newest" ? "oldest" : "newest")}
          className="ml-auto text-ink-soft hover:text-ink underline underline-offset-4"
        >
          {order === "newest" ? "newest first ↓" : "from the beginning ↑"}
        </button>
      </div>

      {/* the timeline */}
      {filtered.length === 0 ? (
        <div className="paper rounded-sm max-w-sm mx-auto p-6 text-center relative mt-8" style={{ transform: "rotate(0.4deg)" }}>
          <p className="font-heading text-xl text-ink">No updates yet.</p>
          <p className="font-hand text-xl text-sepia mt-1 leading-snug">
            Either peace has finally found you,
            <br />
            or you&apos;re gatekeeping the lore.
          </p>
        </div>
      ) : (
        <div
          className={`mt-6 space-y-5 ${grid ? "md:space-y-0 md:grid md:gap-x-4 md:gap-y-5" : ""}`}
          style={grid ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } : undefined}
        >
          {/* column headers (desktop only) */}
          {grid &&
            columnPeople.map((p, i) => (
              <div
                key={p.id}
                className="hidden md:flex items-center gap-2 pb-1 border-b border-dashed"
                style={{ gridColumn: i + 1, gridRow: 1, borderColor: `${accent(p.color).hex}77` }}
              >
                <PersonAvatar person={p} size={26} />
                <span className="font-heading text-ink truncate">{p.name}</span>
                <span className="font-hand text-base text-sepia whitespace-nowrap">&apos;s side</span>
              </div>
            ))}

          {filtered.map((post, i) => {
            const col = colOf(post);
            const span = col < 0;
            const isPlaying = song === post.song && playing;
            const postPeople = people.filter((p) => post.personIds.includes(p.id));
            const tapeCols = postPeople.map((p) => accent(p.color).hex);
            const event = post.eventType ? standardEvent(post.eventType) : undefined;
            const tilt = span ? 0.2 : COL_TILT[col % COL_TILT.length];
            const dense = grid && cols >= 3;
            return (
              <div
                key={post.id}
                className={span && grid ? "md:flex md:justify-center" : undefined}
                style={
                  grid
                    ? { gridColumn: span ? "1 / -1" : col + 1, gridRow: i + 2 }
                    : undefined
                }
              >
                <button
                  onClick={() => onOpenPost(post)}
                  onMouseEnter={() => play(post.song)}
                  onMouseLeave={() => isPlaying && stop()}
                  className={`stack-card paper relative rounded-sm text-left w-full ${dense ? "p-3" : "p-4"} ${
                    grid ? (span ? "md:w-[70%]" : "") : "md:w-[70%] md:mx-auto block"
                  }`}
                  style={{ transform: `rotate(${tilt}deg)` }}
                >
                  {tapeCols.length >= 2 ? (
                    <>
                      <span className="tape w-12 -top-1.5 left-4 rotate-[-13deg]" style={{ background: `${tapeCols[0]}66` }} aria-hidden />
                      <span className="tape w-12 -top-1.5 right-4 rotate-[11deg]" style={{ background: `${tapeCols[1]}66` }} aria-hidden />
                    </>
                  ) : (
                    <span
                      className={`tape ${dense ? "w-9" : "w-12"} -top-1.5 left-5 rotate-[-8deg]`}
                      style={{ background: `${tapeCols[0] ?? accent("moon").hex}66` }}
                      aria-hidden
                    />
                  )}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-type text-sepia text-[11px] leading-none tracking-wide">{formatDate(postDate(post))}</p>
                        {event && (
                          <span className="inline-block mt-1 font-type uppercase tracking-[0.14em] text-[9px] text-burgundy border border-burgundy/50 rounded-sm px-1 py-px">
                            {event.label}
                          </span>
                        )}
                        <h3 className={`font-heading text-ink leading-snug mt-0.5 ${dense ? "text-lg" : "text-xl"}`}>{post.title}</h3>
                      </div>
                      <span className="text-espresso shrink-0 flex flex-col items-center" title={mood(post.moodIcon).label}>
                        <MoodIcon moodKey={post.moodIcon} className="w-5 h-5" />
                      </span>
                    </div>
                    {post.text && (
                      <p className={`mt-1.5 text-ink-soft italic ${dense ? "text-sm line-clamp-2" : "text-[15px] line-clamp-3"}`}>
                        {post.text}
                      </p>
                    )}
                    <div className="mt-2 pt-2 border-t border-dashed ink-line flex items-center gap-2">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          isPlaying ? stop() : play(post.song);
                        }}
                        role="button"
                        aria-label={isPlaying ? "stop song" : "play song"}
                      >
                        <Vinyl size={dense ? 26 : 30} spinning={isPlaying} labelColor={accent(postPeople[0]?.color ?? "gold").hex} />
                      </span>
                      <p className="text-sm text-ink-soft truncate">
                        <span className={`font-heading text-ink ${dense ? "text-sm" : "text-[15px]"}`}>{post.song.title}</span>
                        <span className="italic"> — {post.song.artist}</span>
                      </p>
                      {postPeople.length > 0 && (
                        <span className="ml-auto flex items-center gap-1 shrink-0">
                          {postPeople.map((p) => (
                            <PersonAvatar key={p.id} person={p} size={20} />
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
