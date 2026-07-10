"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { peopleOf, postsOf, useStore } from "@/lib/db";
import type { Post } from "@/lib/types";
import { PlayerProvider } from "./Player";
import { Spire } from "./Spire";
import { EntryModal } from "./EntryModal";

const NAV = [
  { href: "/home", label: "Home", hand: "the gallery" },
  { href: "/me", label: "My Track Record", hand: "your lore" },
  { href: "/new", label: "New Update", hand: "add a track" },
  { href: "/people", label: "People", hand: "the cast" },
  { href: "/friends", label: "Friends", hand: "the audience" },
  { href: "/settings", label: "Settings", hand: "backstage" },
];

/**
 * Authenticated app frame: vintage sidebar on desktop (including the user's
 * own mini stack), sticky top bar + bottom tab nav on mobile.
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const { db, currentUser, ready } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [openPost, setOpenPost] = useState<Post | null>(null);

  useEffect(() => {
    if (ready && !currentUser) router.replace("/login");
  }, [ready, currentUser, router]);

  if (!ready || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-hand text-3xl text-sepia">flipping through the records…</p>
      </div>
    );
  }

  const myPosts = postsOf(db, currentUser.id);
  const myPeople = peopleOf(db, currentUser.id);

  return (
    <PlayerProvider>
      <div className="min-h-screen md:flex">
        {/* ---- desktop sidebar ---- */}
        <aside className="hidden md:flex md:flex-col w-64 shrink-0 newsprint border-r-0 px-4 py-3 gap-3 sticky top-0 h-screen overflow-y-auto scroll-thin shadow-[3px_0_12px_rgba(46,32,21,0.12)]">
          <div>
            <Link href="/home">
              <h1 className="font-title text-[1.7rem] leading-none text-ink">Track Record</h1>
            </Link>
            <p className="cutout text-[10px] rotate-[-1.5deg] mt-1">
              you could write songs about this bs
            </p>
          </div>

          <nav>
            {NAV.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-wrap items-baseline gap-x-2 rounded-sm px-2.5 py-1 transition-colors ${
                    active
                      ? "bg-ink/10 text-ink"
                      : "text-ink-soft hover:text-ink hover:bg-ink/5"
                  }`}
                >
                  <span className={`font-heading text-[17px] whitespace-nowrap ${active ? "italic" : ""}`}>{item.label}</span>
                  <span className="font-hand text-base text-sepia whitespace-nowrap">{item.hand}</span>
                </Link>
              );
            })}
          </nav>

          {/* user's own mini stack */}
          <div className="mt-auto pt-2 border-t border-dashed ink-line">
            <p className="font-hand text-lg text-sepia mb-1 rotate-[-2deg] leading-none">your spire ↓</p>
            <Spire
              owner={currentUser}
              posts={myPosts.slice(0, 3)}
              people={myPeople}
              mini
              onOpenPost={setOpenPost}
              href="/me"
              nameOverride="you"
            />
          </div>
        </aside>

        {/* ---- mobile top bar ---- */}
        <header className="md:hidden sticky top-0 z-30 newsprint border-x-0 border-t-0 px-4 py-2 flex items-center justify-between gap-2">
          <Link href="/home" className="font-title text-xl text-ink">
            Track Record
          </Link>
          <span className="cutout text-[9px] rotate-[-1deg]">you could write songs about this bs</span>
        </header>

        {/* ---- main ---- */}
        <main className="flex-1 min-w-0 pb-24 md:pb-8">{children}</main>

        {/* ---- mobile bottom nav ---- */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 newsprint border-x-0 border-b-0 shadow-[0_-3px_10px_rgba(46,32,21,0.12)] flex justify-around items-end py-2">
          {NAV.slice(0, 5).map((item) => {
            const active = pathname?.startsWith(item.href);
            const short = item.href === "/me" ? "Mine" : item.label.split(" ")[0];
            const isNew = item.href === "/new";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center px-2 ${
                  isNew ? "-mt-4" : active ? "text-ink" : "text-ink-soft/80"
                }`}
              >
                {isNew ? (
                  <span className="w-11 h-11 rounded-full btn-vintage flex items-center justify-center text-2xl">
                    +
                  </span>
                ) : (
                  <>
                    <span className={`font-heading text-base ${active ? "italic" : ""}`}>{short}</span>
                    <span className={`block w-1 h-1 rounded-full mt-0.5 ${active ? "bg-burgundy" : "bg-transparent"}`} />
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {openPost && <EntryModal post={openPost} onClose={() => setOpenPost(null)} />}
      </div>
    </PlayerProvider>
  );
}
