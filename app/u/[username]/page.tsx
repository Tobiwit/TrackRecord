"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { Timeline } from "@/components/Timeline";
import { EntryModal } from "@/components/EntryModal";
import { friendsOf, markSeen, peopleOf, postsOf, useStore } from "@/lib/db";
import type { Post } from "@/lib/types";

export default function FriendPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  return (
    <Shell>
      <FriendInner username={username} />
    </Shell>
  );
}

function FriendInner({ username }: { username: string }) {
  const { db, currentUser } = useStore();
  const [openPost, setOpenPost] = useState<Post | null>(null);

  const owner = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  const isFriend =
    owner && currentUser
      ? owner.id === currentUser.id || friendsOf(db, currentUser.id).some((f) => f.id === owner.id)
      : false;

  useEffect(() => {
    if (currentUser && owner && isFriend && owner.id !== currentUser.id) {
      markSeen(currentUser.id, owner.id);
    }
  }, [currentUser, owner, isFriend]);

  if (!currentUser) return null;

  if (!owner) {
    return (
      <EmptyNote title="No such record." note="Whoever that is, they're not in the archive." />
    );
  }

  if (!isFriend) {
    return (
      <EmptyNote
        title="This record is private."
        note="You have to be in the friend group to hear this album."
        action={
          <Link href="/friends" className="btn-vintage inline-block rounded-sm px-4 py-2 mt-4">
            Send an invite
          </Link>
        }
      />
    );
  }

  return (
    <>
      <Timeline
        owner={owner}
        posts={postsOf(db, owner.id)}
        people={peopleOf(db, owner.id)}
        onOpenPost={setOpenPost}
      />
      {openPost && <EntryModal post={openPost} onClose={() => setOpenPost(null)} />}
    </>
  );
}

function EmptyNote({ title, note, action }: { title: string; note: string; action?: React.ReactNode }) {
  return (
    <div className="p-8 flex justify-center">
      <div className="paper rounded-sm max-w-sm w-full p-8 text-center mt-12" style={{ transform: "rotate(-0.5deg)" }}>
        <p className="font-heading text-xl text-ink">{title}</p>
        <p className="font-hand text-lg text-espresso/80 mt-2">{note}</p>
        {action}
      </div>
    </div>
  );
}
