"use client";

import { useState } from "react";
import type { Post } from "@/lib/types";
import { postDate } from "@/lib/types";
import {
  addComment,
  commentsOf,
  deletePost,
  reactionsOf,
  toggleReaction,
  useStore,
} from "@/lib/db";
import { accent } from "@/lib/colors";
import { formatDate, timeAgo } from "@/lib/format";
import { mood } from "@/lib/moods";
import { standardEvent } from "@/lib/events";
import { REACTION_TYPES, reactionLabel } from "@/lib/reactions";
import { MoodIcon } from "./MoodIcon";
import { Vinyl } from "./Vinyl";
import { PersonAvatar, UserAvatar } from "./Avatar";
import { usePlayer } from "./Player";

/**
 * Full-size entry view — a page torn out of the scrapbook.
 * Renders as a modal over whatever screen opened it.
 */
export function EntryModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const { db, currentUser } = useStore();
  const { play, stop, song, playing } = usePlayer();
  const [commentText, setCommentText] = useState("");

  const owner = db.users.find((u) => u.id === post.ownerUserId);
  const people = db.people.filter((p) => post.personIds.includes(p.id));
  const comments = commentsOf(db, post.id);
  const reactions = reactionsOf(db, post.id);
  const isPlaying = song === post.song && playing;
  const isMine = currentUser?.id === post.ownerUserId;
  const event = post.eventType ? standardEvent(post.eventType) : undefined;

  const reactionCounts = new Map<string, number>();
  for (const r of reactions) reactionCounts.set(r.type, (reactionCounts.get(r.type) ?? 0) + 1);

  return (
    <div
      className="fixed inset-0 z-50 bg-night/80 backdrop-blur-sm flex items-start md:items-center justify-center p-3 md:p-8 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={post.title}
    >
      <div
        className="paper relative rounded-sm max-w-xl w-full my-8 md:my-0"
        onClick={(e) => e.stopPropagation()}
        style={{ transform: "rotate(-0.4deg)" }}
      >
        <span className="tape -top-3 left-8 rotate-[-6deg]" aria-hidden />
        <span className="tape -top-3 right-8 rotate-[5deg]" aria-hidden />

        <button
          onClick={onClose}
          className="absolute top-2 right-3 font-heading text-2xl leading-none text-ink-soft hover:text-burgundy z-10"
          aria-label="Close"
        >
          ×
        </button>

        <div className="p-6 md:p-8">
          {/* header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-hand text-lg text-espresso/80 leading-none">{formatDate(postDate(post))}</p>
              {event && (
                <span className="inline-block mt-1 uppercase tracking-[0.2em] text-[10px] text-burgundy border border-burgundy/50 rounded-sm px-1.5 py-0.5">
                  {event.label}
                </span>
              )}
              <h2 className="font-heading text-2xl md:text-3xl text-ink mt-1 leading-tight">{post.title}</h2>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0 text-espresso">
              <MoodIcon moodKey={post.moodIcon} className="w-7 h-7" />
              <span className="font-hand text-sm text-espresso/80">{mood(post.moodIcon).label}</span>
            </div>
          </div>

          {/* who it's about */}
          {people.length > 0 && (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              {people.map((p) => (
                <span key={p.id} className="flex items-center gap-1.5">
                  <PersonAvatar person={p} size={26} />
                  <span className="text-sm italic" style={{ color: accent(p.color).hex }}>
                    about {p.name}
                    {p.nickname ? ` (${p.nickname})` : ""}
                  </span>
                </span>
              ))}
              {owner && (
                <span className="text-xs text-ink-soft ml-auto">
                  from <span className="font-heading">{owner.displayName}</span>&apos;s track record
                </span>
              )}
            </div>
          )}

          {/* body */}
          {post.text && (
            <p className="mt-4 text-ink leading-relaxed whitespace-pre-wrap border-l-2 pl-3 ink-line">
              {post.text}
            </p>
          )}

          {/* the song */}
          <div className="mt-5 paper-deep rounded-sm p-3 flex items-center gap-3 border border-ink/15">
            {post.song.albumArtUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.song.albumArtUrl} alt="" className="w-14 h-14 rounded-sm object-cover border border-ink/20" />
            ) : (
              <Vinyl size={56} spinning={isPlaying} labelColor={accent(people[0]?.color ?? "gold").hex} />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-hand text-espresso/70 text-sm leading-none">the soundtrack</p>
              <p className="font-heading text-ink truncate">{post.song.title}</p>
              <p className="text-sm text-ink-soft italic truncate">
                {post.song.artist}
                {post.song.album ? ` — ${post.song.album}` : ""}
              </p>
            </div>
            <div className="flex flex-col gap-1 items-end shrink-0">
              <button
                onClick={() => (isPlaying ? stop() : play(post.song))}
                className="btn-vintage rounded-sm px-3 py-1 text-sm"
              >
                {isPlaying ? "◼ Stop" : "▶ Play"}
              </button>
              {post.song.externalUrl && (
                <a
                  href={post.song.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] underline text-ink-soft hover:text-burgundy"
                >
                  Open in Spotify
                </a>
              )}
            </div>
          </div>

          {/* reactions */}
          <div className="mt-5">
            <p className="font-hand text-lg text-espresso/80">the jury reacts</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {REACTION_TYPES.map((rt) => {
                const count = reactionCounts.get(rt.key) ?? 0;
                const mine = reactions.some((r) => r.type === rt.key && r.userId === currentUser?.id);
                return (
                  <button
                    key={rt.key}
                    onClick={() => currentUser && toggleReaction(post.id, currentUser.id, rt.key)}
                    className={`text-xs rounded-full border px-2.5 py-1 transition-colors ${
                      mine
                        ? "bg-burgundy text-cream border-burgundy"
                        : count > 0
                          ? "border-espresso/50 text-espresso bg-espresso/10"
                          : "border-ink/25 text-ink-soft hover:border-espresso hover:text-espresso"
                    }`}
                  >
                    “{rt.label}”{count > 0 && <span className="ml-1 font-heading">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* comments */}
          <div className="mt-5 border-t border-dashed ink-line pt-3">
            <p className="font-hand text-lg text-espresso/80">margin notes</p>
            <div className="mt-2 space-y-2">
              {comments.length === 0 && (
                <p className="text-sm text-ink-soft italic">No comments yet. The group chat is unusually quiet.</p>
              )}
              {comments.map((c) => {
                const author = db.users.find((u) => u.id === c.userId);
                return (
                  <div key={c.id} className="flex items-start gap-2">
                    {author && <UserAvatar user={author} size={24} />}
                    <div className="min-w-0">
                      <p className="text-sm text-ink">
                        <span className="font-heading">{author?.displayName ?? "someone"}</span>{" "}
                        <span className="text-[10px] text-ink-soft">{timeAgo(c.createdAt)}</span>
                      </p>
                      <p className="text-sm text-ink-soft">{c.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {currentUser && (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addComment(post.id, currentUser.id, commentText);
                  setCommentText("");
                }}
              >
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="leave a note in the margin…"
                  className="vintage flex-1 rounded-sm px-2.5 py-1.5 text-sm"
                />
                <button type="submit" className="btn-vintage rounded-sm px-3 py-1.5 text-sm">
                  Add
                </button>
              </form>
            )}
          </div>

          {isMine && (
            <div className="mt-4 text-right">
              <button
                onClick={() => {
                  if (window.confirm("Tear this page out of the record? This can't be undone.")) {
                    deletePost(post.id);
                    onClose();
                  }
                }}
                className="text-xs text-burgundy/80 underline hover:text-burgundy"
              >
                tear this page out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
