"use client";

import { useMemo, useState } from "react";
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

/**
 * Full vertical timeline with filters — the detail view behind each spire.
 * With two people, entries split into left/right columns; shared or general
 * updates sit in the center.
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
  const stackPeopleIds = Array.from(new Set(posts.flatMap((p) => p.personIds)));
  const columnPeople = people.filter((p) => stackPeopleIds.includes(p.id)).slice(0, 2);
  const twoCol = columnPeople.length === 2 && personFilter === "all";

  const filtered = useMemo(() => {
    let list = [...posts];
    if (personFilter !== "all") list = list.filter((p) => p.personIds.includes(personFilter));
    if (typeFilter !== "all") list = list.filter((p) => p.type === typeFilter);
    if (moodFilter !== "all") list = list.filter((p) => p.moodIcon === moodFilter);
    list.sort((a, b) => (order === "newest" ? postDate(b) - postDate(a) : postDate(a) - postDate(b)));
    return list;
  }, [posts, personFilter, typeFilter, moodFilter, order]);

  const usedMoods = Array.from(new Set(posts.map((p) => p.moodIcon)));

  const columnFor = (post: Post): "left" | "right" | "center" => {
    if (!twoCol || post.personIds.length !== 1) return "center";
    if (post.personIds[0] === columnPeople[0].id) return "left";
    if (post.personIds[0] === columnPeople[1].id) return "right";
    return "center";
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* profile header */}
      <div className="flex items-center gap-4 flex-wrap">
        <UserAvatar user={owner} size={64} />
        <div className="min-w-0">
          <h2 className="font-heading text-2xl md:text-3xl text-cream">{owner.displayName}</h2>
          <p className="text-cream/60 text-sm">@{owner.username}</p>
        </div>
        {activePeople.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="font-hand text-gold/80 text-lg">currently in the lore:</span>
            {activePeople.map((p) => (
              <span key={p.id} className="flex items-center gap-1" title={p.nickname ?? p.name}>
                <PersonAvatar person={p} size={26} />
                <span className="text-sm text-cream/80 italic">{p.name}</span>
              </span>
            ))}
          </div>
        )}
        {headerExtra}
      </div>

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
          className="ml-auto text-cream/70 hover:text-cream underline underline-offset-4"
        >
          {order === "newest" ? "newest first ↓" : "from the beginning ↑"}
        </button>
      </div>

      {/* column legend */}
      {twoCol && (
        <div className="mt-4 flex justify-between text-sm px-2">
          {columnPeople.map((p, i) => (
            <span key={p.id} className="flex items-center gap-1.5" style={{ color: accent(p.color).hex }}>
              {i === 1 && <span className="text-cream/40 font-hand">the other line —</span>}
              <PersonAvatar person={p} size={22} />
              <span className="italic text-cream/80">{p.name}&apos;s side</span>
            </span>
          ))}
        </div>
      )}

      {/* the timeline */}
      <div className="relative mt-6">
        {/* spine */}
        <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-cream/15" aria-hidden />
        <div className="space-y-6">
          {filtered.length === 0 && (
            <div className="paper rounded-sm max-w-sm mx-auto p-6 text-center relative" style={{ transform: "rotate(0.4deg)" }}>
              <p className="font-heading text-lg text-ink">No updates yet.</p>
              <p className="font-hand text-lg text-espresso/80 mt-1 leading-snug">
                Either peace has finally found you,
                <br />
                or you&apos;re gatekeeping the lore.
              </p>
            </div>
          )}
          {filtered.map((post) => {
            const col = columnFor(post);
            const isPlaying = song === post.song && playing;
            const postPeople = people.filter((p) => post.personIds.includes(p.id));
            const stripe =
              postPeople.length >= 2
                ? `linear-gradient(to bottom, ${accent(postPeople[0].color).hex} 50%, ${accent(postPeople[1].color).hex} 50%)`
                : accent(postPeople[0]?.color ?? "moon").hex;
            const event = post.eventType ? standardEvent(post.eventType) : undefined;
            return (
              <div
                key={post.id}
                className={`relative flex ${col === "left" ? "justify-start" : col === "right" ? "justify-end" : "justify-center"}`}
              >
                {/* node on the spine */}
                <span
                  className="absolute left-1/2 top-6 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-night"
                  style={{ background: accent(postPeople[0]?.color ?? "gold").hex }}
                  aria-hidden
                />
                <button
                  onClick={() => onOpenPost(post)}
                  className={`stack-card paper relative rounded-sm text-left p-4 w-full ${twoCol ? "md:w-[46%]" : "md:w-[70%]"}`}
                  style={{ transform: `rotate(${col === "left" ? -0.6 : col === "right" ? 0.6 : 0.2}deg)` }}
                >
                  <span
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r"
                    style={{ background: stripe }}
                    aria-hidden
                  />
                  <div className="pl-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-hand text-espresso/80 text-sm leading-none">{formatDate(postDate(post))}</p>
                        {event && (
                          <span className="inline-block mt-1 uppercase tracking-[0.18em] text-[9px] text-burgundy border border-burgundy/40 rounded-sm px-1 py-px">
                            {event.label}
                          </span>
                        )}
                        <h3 className="font-heading text-lg text-ink leading-snug mt-0.5">{post.title}</h3>
                      </div>
                      <span className="text-espresso shrink-0 flex flex-col items-center" title={mood(post.moodIcon).label}>
                        <MoodIcon moodKey={post.moodIcon} className="w-5 h-5" />
                      </span>
                    </div>
                    {post.text && <p className="mt-1.5 text-sm text-ink-soft italic line-clamp-3">{post.text}</p>}
                    <div className="mt-2 pt-2 border-t border-dashed ink-line flex items-center gap-2">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          isPlaying ? stop() : play(post.song);
                        }}
                        role="button"
                        aria-label={isPlaying ? "stop song" : "play song"}
                      >
                        <Vinyl size={30} spinning={isPlaying} labelColor={accent(postPeople[0]?.color ?? "gold").hex} />
                      </span>
                      <p className="text-xs text-ink-soft truncate">
                        <span className="font-heading text-ink text-sm">{post.song.title}</span>
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
      </div>
    </div>
  );
}
