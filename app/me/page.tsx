"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Timeline } from "@/components/Timeline";
import { EntryModal } from "@/components/EntryModal";
import { peopleOf, postsOf, useStore } from "@/lib/db";
import type { Post } from "@/lib/types";

export default function MePage() {
  return (
    <Shell>
      <Suspense fallback={null}>
        <MeInner />
      </Suspense>
    </Shell>
  );
}

function MeInner() {
  const { db, currentUser } = useStore();
  const [openPost, setOpenPost] = useState<Post | null>(null);
  // /record links here pre-filtered to one storyline
  const requested = useSearchParams().get("person");

  if (!currentUser) return null;

  const people = peopleOf(db, currentUser.id);
  // a stale or hand-typed id would filter the timeline down to nothing
  const personParam = people.some((p) => p.id === requested) ? requested! : undefined;

  return (
    <>
      <Timeline
        key={personParam ?? "all"}
        owner={currentUser}
        posts={postsOf(db, currentUser.id)}
        people={people}
        onOpenPost={setOpenPost}
        initialPerson={personParam}
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
