"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Shell } from "@/components/Shell";
import { Spire } from "@/components/Spire";
import { EntryModal } from "@/components/EntryModal";
import { usePlayer } from "@/components/Player";
import { friendsOf, hasUnseen, peopleOf, postsOf, useStore } from "@/lib/db";
import type { Post, User } from "@/lib/types";

export default function HomePage() {
  return (
    <Shell>
      <HomeInner />
    </Shell>
  );
}

function HomeInner() {
  const { db, currentUser } = useStore();
  const [openPost, setOpenPost] = useState<Post | null>(null);

  if (!currentUser) return null;

  const friends = friendsOf(db, currentUser.id).sort((a, b) => {
    // friends with unseen updates first, then by latest post
    const an = hasUnseen(db, currentUser.id, a.id) ? 1 : 0;
    const bn = hasUnseen(db, currentUser.id, b.id) ? 1 : 0;
    if (an !== bn) return bn - an;
    const ap = postsOf(db, a.id)[0]?.createdAt ?? 0;
    const bp = postsOf(db, b.id)[0]?.createdAt ?? 0;
    return bp - ap;
  });

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl text-cream">The Gallery</h2>
          <p className="font-hand text-gold/80 text-lg">your friends are waiting for the tea</p>
        </div>
        <Link href="/new" className="hidden md:inline-block btn-vintage rounded-sm px-4 py-2">
          + New Update
        </Link>
      </div>

      {friends.length === 0 ? (
        <div className="paper rounded-sm max-w-md mx-auto mt-16 p-8 text-center" style={{ transform: "rotate(-0.5deg)" }}>
          <p className="font-heading text-xl text-ink">The gallery is empty.</p>
          <p className="font-hand text-lg text-espresso/80 mt-2">
            No friends on the record yet — the lore needs an audience.
          </p>
          <Link href="/friends" className="btn-vintage inline-block rounded-sm px-4 py-2 mt-4">
            Find your people
          </Link>
        </div>
      ) : (
        <FriendRail friends={friends} onOpenPost={setOpenPost} />
      )}

      {openPost && <EntryModal post={openPost} onClose={() => setOpenPost(null)} />}
    </div>
  );
}

function FriendRail({ friends, onOpenPost }: { friends: User[]; onOpenPost: (p: Post) => void }) {
  const { db, currentUser } = useStore();
  const { play } = usePlayer();
  const railRef = useRef<HTMLDivElement>(null);
  const lastAuto = useRef<string | null>(null);

  // Mobile: when a stack snaps into view, cue up its newest song.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || typeof window === "undefined") return;
    if (window.innerWidth >= 768) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio > 0.7) {
            const friendId = (entry.target as HTMLElement).dataset.friendId;
            if (friendId && lastAuto.current !== friendId) {
              lastAuto.current = friendId;
              const top = postsOf(db, friendId)[0];
              if (top) play(top.song);
            }
          }
        }
      },
      { root: rail, threshold: 0.7 }
    );
    rail.querySelectorAll("[data-friend-id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friends.map((f) => f.id).join(",")]);

  if (!currentUser) return null;

  return (
    <div
      ref={railRef}
      className="mt-6 md:mt-10 flex overflow-x-auto scroll-thin scroll-hide md:scroll-auto gap-0 md:gap-14 items-start snap-x snap-mandatory md:snap-none pb-6"
    >
      {friends.map((friend) => (
        <div
          key={friend.id}
          data-friend-id={friend.id}
          className="snap-center shrink-0 w-full md:w-auto flex justify-center pt-4"
        >
          <Spire
            owner={friend}
            posts={postsOf(db, friend.id)}
            people={peopleOf(db, friend.id)}
            hasNew={hasUnseen(db, currentUser.id, friend.id)}
            onOpenPost={onOpenPost}
            href={`/u/${friend.username}`}
          />
        </div>
      ))}
    </div>
  );
}
