"use client";

import Link from "next/link";
import type { Person, Post, User } from "@/lib/types";
import { postDate } from "@/lib/types";
import { accent } from "@/lib/colors";
import { formatShortDate } from "@/lib/format";
import { MoodIcon } from "./MoodIcon";
import { Vinyl } from "./Vinyl";
import { PersonAvatar, UserAvatar } from "./Avatar";
import { usePlayer } from "./Player";
import { standardEvent } from "@/lib/events";

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic little rotation so the stack looks hand-placed, not generated. */
function tilt(id: string): number {
  return ((hashId(id) % 50) / 10) - 2.5;
}

type Lean = "left" | "right" | "center";

/**
 * Figure out how a post should lean inside a two-person stack:
 * person A leans left, person B leans right, shared/none stays centered.
 */
function leanFor(post: Post, columnPeople: Person[]): Lean {
  if (columnPeople.length < 2 || post.personIds.length !== 1) return "center";
  if (post.personIds[0] === columnPeople[0].id) return "left";
  if (post.personIds[0] === columnPeople[1].id) return "right";
  return "center";
}

export interface SpireProps {
  owner: User;
  posts: Post[]; // will be sorted newest-first internally
  people: Person[]; // owner's people
  hasNew?: boolean;
  mini?: boolean;
  onOpenPost: (post: Post) => void;
  /** where clicking the name/avatar goes; omit to disable */
  href?: string;
  nameOverride?: string;
}

export function Spire({ owner, posts, people, hasNew, mini, onOpenPost, href, nameOverride }: SpireProps) {
  const { play, stop, song, playing } = usePlayer();
  const sorted = [...posts].sort((a, b) => postDate(b) - postDate(a));
  const top = sorted[0];
  const rest = sorted.slice(1);

  // People that actually appear in this stack, capped at two for the lean layout
  const activeIds = Array.from(new Set(sorted.flatMap((p) => p.personIds)));
  const columnPeople = people.filter((p) => activeIds.includes(p.id)).slice(0, 2);
  const twoCol = columnPeople.length === 2;

  const W = mini ? "w-44" : "w-64 md:w-72";
  const leanShift = (lean: Lean) =>
    lean === "left" ? "-ml-6 mr-6" : lean === "right" ? "ml-6 -mr-6" : "";

  const personFor = (post: Post): Person | undefined =>
    people.find((p) => p.id === post.personIds[0]);

  const stripeFor = (post: Post): string => {
    const cols = post.personIds.map((id) => accent(people.find((p) => p.id === id)?.color ?? "moon").hex);
    if (cols.length >= 2) return `linear-gradient(to bottom, ${cols[0]} 50%, ${cols[1]} 50%)`;
    return cols[0] ?? accent("moon").hex;
  };

  const topIsPlaying = top && song === top.song && playing;

  return (
    <div className={`flex flex-col items-center ${mini ? "gap-2" : "gap-3"} shrink-0`}>
      {/* the stack grows downward visually: newest big card first, older shrink below */}
      <div className={`flex flex-col items-center ${W}`}>
        {top ? (
          <button
            onClick={() => onOpenPost(top)}
            onMouseEnter={() => !mini && play(top.song)}
            onMouseLeave={() => !mini && topIsPlaying && stop()}
            className={`stack-card paper relative rounded-sm text-left w-full ${twoCol ? leanShift(leanFor(top, columnPeople)) : ""} ${mini ? "p-2.5" : "p-4"}`}
            style={{ transform: `rotate(${tilt(top.id)}deg)`, zIndex: 20 }}
          >
            <span className="tape -top-2 left-1/2 -translate-x-1/2 rotate-[-3deg]" aria-hidden />
            <span
              className="absolute left-0 top-2 bottom-2 w-1 rounded-r"
              style={{ background: stripeFor(top) }}
              aria-hidden
            />
            <div className="flex items-start justify-between gap-2 pl-2">
              <div className="min-w-0">
                <p className="font-hand text-espresso/80 text-sm leading-none">
                  {formatShortDate(postDate(top))}
                  {top.type === "standard_event" && (
                    <span className="ml-2 uppercase tracking-widest text-[9px] font-body text-burgundy/80 border border-burgundy/40 rounded-sm px-1 py-px">
                      {standardEvent(top.eventType ?? "")?.label ?? "event"}
                    </span>
                  )}
                </p>
                <h3 className={`font-heading text-ink mt-1 leading-snug ${mini ? "text-sm" : "text-lg"} line-clamp-2`}>
                  {top.title}
                </h3>
              </div>
              <span className="text-espresso shrink-0" title="mood">
                <MoodIcon moodKey={top.moodIcon} className={mini ? "w-4 h-4" : "w-5 h-5"} />
              </span>
            </div>
            {!mini && top.text && (
              <p className="pl-2 mt-1 text-sm text-ink-soft line-clamp-2 italic">{top.text}</p>
            )}
            <div className={`pl-2 mt-2 flex items-center gap-2 ${mini ? "" : "pt-2 border-t border-dashed ink-line"}`}>
              <Vinyl size={mini ? 22 : 40} spinning={Boolean(topIsPlaying)} labelColor={accent(personFor(top)?.color ?? "gold").hex} />
              <div className="min-w-0">
                <p className={`text-ink truncate ${mini ? "text-[11px]" : "text-sm"} font-heading`}>{top.song.title}</p>
                <p className={`text-ink-soft italic truncate ${mini ? "text-[10px]" : "text-xs"}`}>{top.song.artist}</p>
              </div>
              {!mini && (
                <span className="ml-auto font-hand text-espresso/70 text-sm whitespace-nowrap">
                  {topIsPlaying ? "now spinning" : "hover to play"}
                </span>
              )}
            </div>
          </button>
        ) : (
          <div className={`paper rounded-sm p-4 w-full text-center ${mini ? "p-2.5" : ""}`}>
            <p className="font-hand text-espresso text-lg leading-tight">No updates yet.</p>
            {!mini && (
              <p className="text-xs text-ink-soft italic mt-1">
                Either peace has finally found them, or they&apos;re gatekeeping the lore.
              </p>
            )}
          </div>
        )}

        {/* older, smaller cards below */}
        {rest.map((post, i) => {
          const lean = twoCol ? leanFor(post, columnPeople) : "center";
          const shrink = Math.min(i * 4 + 8, 24); // percent narrower with depth
          return (
            <button
              key={post.id}
              onClick={() => onOpenPost(post)}
              className={`stack-card paper-deep relative rounded-sm text-left -mt-1 ${twoCol ? leanShift(lean) : ""} ${mini ? "px-2 py-1.5" : "px-3 py-2"}`}
              style={{
                transform: `rotate(${tilt(post.id)}deg)`,
                width: `${100 - shrink}%`,
                zIndex: 19 - i,
                boxShadow: "0 1px 2px rgba(43,33,24,0.2), 0 4px 10px rgba(43,33,24,0.18)",
              }}
            >
              <span
                className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r"
                style={{ background: stripeFor(post) }}
                aria-hidden
              />
              <div className="flex items-center gap-2 pl-1.5">
                <span className="text-espresso shrink-0">
                  <MoodIcon moodKey={post.moodIcon} className={mini ? "w-3 h-3" : "w-3.5 h-3.5"} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`font-heading text-ink truncate leading-tight ${mini ? "text-[11px]" : "text-[13px]"}`}>
                    {post.title}
                  </p>
                  <p className={`text-ink-soft ${mini ? "text-[9px]" : "text-[10px]"}`}>
                    {formatShortDate(postDate(post))}
                    <span className="mx-1" aria-hidden>·</span>
                    <span className="italic">♪ {post.song.title}</span>
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* footer: avatar, name, active people chips */}
      <FooterBadge
        owner={owner}
        columnPeople={columnPeople}
        hasNew={hasNew}
        mini={mini}
        href={href}
        nameOverride={nameOverride}
      />
    </div>
  );
}

function FooterBadge({
  owner,
  columnPeople,
  hasNew,
  mini,
  href,
  nameOverride,
}: {
  owner: User;
  columnPeople: Person[];
  hasNew?: boolean;
  mini?: boolean;
  href?: string;
  nameOverride?: string;
}) {
  const inner = (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <UserAvatar user={owner} size={mini ? 34 : 48} />
        {hasNew && (
          <span
            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-burgundy border-2 border-night"
            title="new lore"
          />
        )}
      </div>
      <p className={`font-heading text-cream ${mini ? "text-xs" : "text-sm"} tracking-wide`}>
        {nameOverride ?? owner.displayName}
      </p>
      {columnPeople.length > 0 && (
        <div className="flex items-center gap-1">
          {columnPeople.map((p) => (
            <span key={p.id} className="flex items-center gap-1" title={p.name}>
              <PersonAvatar person={p} size={mini ? 14 : 18} />
              {!mini && <span className="text-[10px] text-cream/70 italic">{p.name}</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {inner}
      </Link>
    );
  }
  return inner;
}
