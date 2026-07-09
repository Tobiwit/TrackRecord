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

  /** person-colored washi tape strips holding the scrap down */
  const tapesFor = (post: Post, small = false) => {
    const cols = post.personIds
      .map((id) => people.find((p) => p.id === id))
      .filter(Boolean)
      .map((p) => accent(p!.color).hex);
    const w = small ? "w-8" : "w-14";
    if (cols.length >= 2) {
      return (
        <>
          <span className={`tape ${w} -top-1.5 left-3 rotate-[-14deg]`} style={{ background: `${cols[0]}66` }} aria-hidden />
          <span className={`tape ${w} -top-1.5 right-3 rotate-[12deg]`} style={{ background: `${cols[1]}66` }} aria-hidden />
        </>
      );
    }
    return (
      <span
        className={`tape ${w} -top-1.5 ${small ? "left-2 rotate-[-10deg]" : "left-1/2 -translate-x-1/2 rotate-[-3deg]"}`}
        style={{ background: `${cols[0] ?? accent("moon").hex}66` }}
        aria-hidden
      />
    );
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
            {tapesFor(top)}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-type text-sepia text-[11px] leading-none tracking-wide">
                  {formatShortDate(postDate(top))}
                  {top.type === "standard_event" && (
                    <span className="ml-2 uppercase tracking-[0.14em] text-[9px] text-burgundy border border-burgundy/50 rounded-sm px-1 py-px">
                      {standardEvent(top.eventType ?? "")?.label ?? "event"}
                    </span>
                  )}
                </p>
                <h3 className={`font-heading text-ink mt-1 leading-snug ${mini ? "text-[15px]" : "text-xl"} line-clamp-2`}>
                  {top.title}
                </h3>
              </div>
              <span className="text-espresso shrink-0" title="mood">
                <MoodIcon moodKey={top.moodIcon} className={mini ? "w-4 h-4" : "w-5 h-5"} />
              </span>
            </div>
            {!mini && top.text && (
              <p className="mt-1 text-[15px] text-ink-soft line-clamp-2 italic">{top.text}</p>
            )}
            <div className={`mt-2 flex items-center gap-2 ${mini ? "" : "pt-2 border-t border-dashed ink-line"}`}>
              <Vinyl size={mini ? 22 : 40} spinning={Boolean(topIsPlaying)} labelColor={accent(personFor(top)?.color ?? "gold").hex} />
              <div className="min-w-0 flex-1">
                <p className={`text-ink truncate ${mini ? "text-[12px]" : "text-[15px]"} font-heading`}>{top.song.title}</p>
                <p className={`text-ink-soft italic truncate ${mini ? "text-[11px]" : "text-sm"}`}>{top.song.artist}</p>
              </div>
            </div>
            {!mini && (
              <p className="font-hand text-sepia text-base leading-none text-right mt-1 rotate-[-1.5deg]">
                {topIsPlaying ? "now spinning ♪" : "hover to play ♪"}
              </p>
            )}
          </button>
        ) : (
          <div className={`paper rounded-sm p-4 w-full text-center ${mini ? "p-2.5" : ""}`}>
            <p className="font-hand text-sepia text-xl leading-tight">No updates yet.</p>
            {!mini && (
              <p className="text-sm text-ink-soft italic mt-1">
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
                boxShadow: "0 1px 2px rgba(46,32,21,0.16), 0 4px 10px rgba(46,32,21,0.14)",
              }}
            >
              {tapesFor(post, true)}
              <div className="flex items-center gap-2">
                <span className="text-espresso shrink-0">
                  <MoodIcon moodKey={post.moodIcon} className={mini ? "w-3 h-3" : "w-3.5 h-3.5"} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`font-heading text-ink truncate leading-tight ${mini ? "text-[12px]" : "text-sm"}`}>
                    {post.title}
                  </p>
                  <p className={`text-ink-soft font-type ${mini ? "text-[8px]" : "text-[9px]"} tracking-wide`}>
                    {formatShortDate(postDate(post))}
                    <span className="mx-1" aria-hidden>·</span>
                    <span>♪ {post.song.title}</span>
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
            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-burgundy border-2 border-card"
            title="new lore"
          />
        )}
      </div>
      <p className={`font-heading text-ink ${mini ? "text-sm" : "text-base"}`}>
        {nameOverride ?? owner.displayName}
      </p>
      {columnPeople.length > 0 && (
        <div className="flex items-center gap-1.5">
          {columnPeople.map((p) => (
            <span key={p.id} className="flex items-center gap-1" title={p.name}>
              <PersonAvatar person={p} size={mini ? 14 : 18} />
              {!mini && <span className="text-xs text-ink-soft italic">{p.name}</span>}
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
