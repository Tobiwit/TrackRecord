"use client";

import Link from "next/link";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Timeline } from "@/components/Timeline";
import { EntryModal } from "@/components/EntryModal";
import { peopleOf, postsOf, useStore } from "@/lib/db";
import type { Post } from "@/lib/types";

export default function MePage() {
  return (
    <Shell>
      <MeInner />
    </Shell>
  );
}

function MeInner() {
  const { db, currentUser } = useStore();
  const [openPost, setOpenPost] = useState<Post | null>(null);

  if (!currentUser) return null;

  return (
    <>
      <Timeline
        owner={currentUser}
        posts={postsOf(db, currentUser.id)}
        people={peopleOf(db, currentUser.id)}
        onOpenPost={setOpenPost}
        headerExtra={
          <Link href="/new" className="btn-vintage rounded-sm px-4 py-2 ml-auto md:ml-4 shrink-0">
            + Add to the lore
          </Link>
        }
      />
      {openPost && <EntryModal post={openPost} onClose={() => setOpenPost(null)} />}
    </>
  );
}
