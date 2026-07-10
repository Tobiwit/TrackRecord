"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { EntryModal } from "@/components/EntryModal";
import { PersonAvatar } from "@/components/Avatar";
import { Vinyl } from "@/components/Vinyl";
import { MoodIcon } from "@/components/MoodIcon";
import { usePlayer } from "@/components/Player";
import { friendsOf, updatePerson, useStore } from "@/lib/db";
import type { Post } from "@/lib/types";
import { postDate } from "@/lib/types";
import { accent } from "@/lib/colors";
import { formatShortDate } from "@/lib/format";
import { mood } from "@/lib/moods";

export default function EraPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = use(params);
  return (
    <Shell>
      <EraInner personId={personId} />
    </Shell>
  );
}

function EraInner({ personId }: { personId: string }) {
  const { db, currentUser } = useStore();
  const router = useRouter();
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const { play, stop, song, playing } = usePlayer();

  if (!currentUser) return null;

  const person = db.people.find((p) => p.id === personId);
  const owner = person ? db.users.find((u) => u.id === person.ownerUserId) : undefined;
  const canSee =
    person &&
    owner &&
    (owner.id === currentUser.id || friendsOf(db, currentUser.id).some((f) => f.id === owner.id));

  if (!person || !owner || !canSee) {
    return (
      <Note title="No such record." note="This sleeve isn't in the crate." />
    );
  }

  if (person.active) {
    return (
      <Note
        title="This era is still being written."
        note="Come back when the record gets pressed."
        action={
          <Link
            href={owner.id === currentUser.id ? "/me" : `/u/${owner.username}`}
            className="btn-vintage inline-block rounded-sm px-4 py-2 mt-4"
          >
            Back to the timeline
          </Link>
        }
      />
    );
  }

  if (!person.eraTitle) {
    const isOwner = owner.id === currentUser.id;
    return (
      <Note
        title="Archived, but not pressed."
        note={
          isOwner
            ? "The era is on the shelf — give it a name and press it into a record."
            : "This era sits unpressed on the shelf. The lore keeper hasn't named it yet."
        }
        action={
          isOwner ? (
            <button
              onClick={() => {
                const title = window.prompt("Name this era:", `The ${person.name} Era`);
                if (title === null) return;
                updatePerson(person.id, { eraTitle: title.trim() || `The ${person.name} Era` });
              }}
              className="btn-vintage inline-block rounded-sm px-4 py-2 mt-4"
            >
              ♪ Press the record
            </button>
          ) : undefined
        }
      />
    );
  }

  const posts = db.posts
    .filter((po) => po.ownerUserId === owner.id && po.personIds.includes(person.id))
    .sort((a, b) => postDate(a) - postDate(b));

  const color = accent(person.color);
  const title = person.eraTitle?.trim() || `The ${person.name} Era`;
  const isMine = owner.id === currentUser.id;

  if (posts.length === 0) {
    return (
      <Note
        title={title}
        note="Pressed in silence — not a single track was recorded. Honestly? Iconic restraint."
        action={
          isMine ? (
            <button
              onClick={() => {
                updatePerson(person.id, { active: true });
                router.push("/people");
              }}
              className="btn-vintage inline-block rounded-sm px-4 py-2 mt-4"
            >
              Revive the era
            </button>
          ) : undefined
        }
      />
    );
  }

  const first = postDate(posts[0]);
  const last = postDate(posts[posts.length - 1]);
  const days = Math.max(1, Math.round((last - first) / 86_400_000));

  // liner notes: mood distribution
  const moodCounts = new Map<string, number>();
  for (const po of posts) moodCounts.set(po.moodIcon, (moodCounts.get(po.moodIcon) ?? 0) + 1);
  const topMoods = [...moodCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, n]) => `${Math.round((n / posts.length) * 100)}% ${mood(key).label}`);

  const sideA = posts.slice(0, Math.ceil(posts.length / 2));
  const sideB = posts.slice(Math.ceil(posts.length / 2));
  const anyPlaying = playing && posts.some((po) => po.song === song);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* back link */}
      <Link
        href={isMine ? "/me" : `/u/${owner.username}`}
        className="text-sm underline text-ink-soft hover:text-ink"
      >
        ← back to {isMine ? "your timeline" : `${owner.displayName}'s timeline`}
      </Link>

      <div className="mt-4 grid md:grid-cols-[1fr_1.2fr] gap-6 items-start">
        {/* ---- the sleeve ---- */}
        <div className="relative">
          {/* vinyl peeking out */}
          <div className="absolute top-1/2 -translate-y-1/2 -right-8 md:-right-10 hidden sm:block" aria-hidden>
            <Vinyl size={150} spinning={anyPlaying} labelColor={color.hex} />
          </div>
          <div
            className="paper relative rounded-sm p-6 md:p-8 aspect-square flex flex-col"
            style={{ transform: "rotate(-0.8deg)" }}
          >
            <span className="tape -top-2.5 left-8 rotate-[-5deg]" aria-hidden />
            <span className="tape -top-2.5 right-8 rotate-[4deg]" aria-hidden />
            <span
              className="absolute inset-3 border pointer-events-none"
              style={{ borderColor: `${color.hex}55` }}
              aria-hidden
            />
            <p className="font-type text-[11px] tracking-[0.2em] uppercase text-sepia">
              {owner.displayName} presents
            </p>
            <h1 className="font-title text-3xl md:text-4xl text-ink leading-tight mt-2">{title}</h1>
            <p className="font-type text-xs text-sepia mt-2 tracking-wide">
              {formatShortDate(first)} — {formatShortDate(last)} · {days} {days === 1 ? "day" : "days"} · {posts.length}{" "}
              {posts.length === 1 ? "track" : "tracks"}
            </p>

            <div className="mt-auto">
              <div className="flex items-center gap-2.5">
                <PersonAvatar person={person} size={56} />
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-lg text-ink">{person.name}</p>
                  {person.nickname && (
                    <p className="font-hand text-lg text-sepia leading-none">“{person.nickname}”</p>
                  )}
                </div>
              </div>
              <p
                className="font-type text-[10px] uppercase tracking-[0.18em] border rounded-sm px-1.5 py-0.5 w-fit mt-3"
                style={{ color: color.hex, borderColor: `${color.hex}88` }}
              >
                archived era
              </p>
            </div>
          </div>

          {/* liner notes */}
          <div className="paper-deep rounded-sm p-4 mt-8 border border-ink/15" style={{ transform: "rotate(0.5deg)" }}>
            <p className="font-hand text-xl text-sepia leading-none rotate-[-1deg] origin-left">liner notes</p>
            <p className="text-[15px] text-ink-soft italic mt-2">
              This era was {topMoods.join(", ")}.
            </p>
            <p className="text-sm text-ink-soft mt-1.5">
              It opened with <span className="font-heading text-ink">“{posts[0].title}”</span> and closed on{" "}
              <span className="font-heading text-ink">“{posts[posts.length - 1].title}”</span>.
            </p>
            {isMine && (
              <button
                onClick={() => {
                  if (window.confirm(`Take ${person.name} off the shelf and reopen the era?`)) {
                    updatePerson(person.id, { active: true });
                    router.push("/people");
                  }
                }}
                className="text-xs underline text-burgundy/80 hover:text-burgundy mt-3"
              >
                revive this era
              </button>
            )}
          </div>
        </div>

        {/* ---- the tracklist ---- */}
        <div className="paper rounded-sm p-5 md:p-6 relative" style={{ transform: "rotate(0.4deg)" }}>
          <span className="tape -top-2.5 left-1/2 -translate-x-1/2 rotate-[2deg]" aria-hidden />
          <h2 className="font-title text-xl text-ink">Tracklist</h2>
          <p className="font-hand text-lg text-sepia leading-none mt-0.5">hover to play, click for the lore</p>

          <TrackSide label="Side A" posts={sideA} startIndex={1} color={color.hex} onOpen={setOpenPost} />
          {sideB.length > 0 && (
            <TrackSide
              label="Side B"
              posts={sideB}
              startIndex={sideA.length + 1}
              color={color.hex}
              onOpen={setOpenPost}
            />
          )}
        </div>
      </div>

      {openPost && <EntryModal post={openPost} onClose={() => setOpenPost(null)} />}
    </div>
  );

  function TrackSide({
    label,
    posts: sidePosts,
    startIndex,
    color: hex,
    onOpen,
  }: {
    label: string;
    posts: Post[];
    startIndex: number;
    color: string;
    onOpen: (p: Post) => void;
  }) {
    return (
      <div className="mt-4">
        <p
          className="font-type text-[10px] uppercase tracking-[0.22em] border-b border-dashed pb-1"
          style={{ color: hex, borderColor: `${hex}66` }}
        >
          {label}
        </p>
        <ol className="mt-2 space-y-0.5">
          {sidePosts.map((po, i) => {
            const isPlaying = song === po.song && playing;
            return (
              <li key={po.id}>
                <button
                  onClick={() => onOpen(po)}
                  onMouseEnter={() => play(po.song)}
                  onMouseLeave={() => isPlaying && stop()}
                  className="w-full text-left flex items-baseline gap-2 rounded-sm px-1.5 py-1 hover:bg-espresso/10"
                >
                  <span className="font-type text-xs text-sepia shrink-0 w-5 text-right">
                    {startIndex + i}.
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`font-heading text-[15px] ${isPlaying ? "text-burgundy" : "text-ink"}`}>
                      {po.song.title}
                    </span>
                    <span className="text-xs text-ink-soft italic"> — {po.song.artist}</span>
                    <span className="block text-xs text-ink-soft truncate">
                      <span className="inline-block align-[-2px] mr-1 text-espresso">
                        <MoodIcon moodKey={po.moodIcon} className="w-3 h-3" />
                      </span>
                      {po.title} · {formatShortDate(postDate(po))}
                    </span>
                  </span>
                  <span className="font-hand text-base text-sepia shrink-0">
                    {isPlaying ? "♪ spinning" : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }
}

function Note({ title, note, action }: { title: string; note: string; action?: React.ReactNode }) {
  return (
    <div className="p-8 flex justify-center">
      <div className="paper rounded-sm max-w-sm w-full p-8 text-center mt-12" style={{ transform: "rotate(-0.5deg)" }}>
        <p className="font-heading text-xl text-ink">{title}</p>
        <p className="font-hand text-xl text-sepia mt-2">{note}</p>
        {action}
      </div>
    </div>
  );
}
