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
  const { db, currentUser } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // store hydrates client-side; wait one tick before deciding auth
    setChecked(true);
  }, []);

  useEffect(() => {
    if (checked && !currentUser) router.replace("/login");
  }, [checked, currentUser, router]);

  if (!checked || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-hand text-2xl text-cream/60">flipping through the records…</p>
      </div>
    );
  }

  const myPosts = postsOf(db, currentUser.id);
  const myPeople = peopleOf(db, currentUser.id);

  return (
    <PlayerProvider>
      <div className="min-h-screen md:flex">
        {/* ---- desktop sidebar ---- */}
        <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-cream/10 p-5 gap-6 sticky top-0 h-screen overflow-y-auto scroll-thin">
          <div>
            <Link href="/home">
              <h1 className="font-heading text-3xl text-cream tracking-wide">Track Record</h1>
            </Link>
            <p className="font-hand text-gold/90 text-lg leading-tight mt-0.5">
              you could write songs about this bs
            </p>
          </div>

          <nav className="space-y-1">
            {NAV.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-sm px-3 py-2 transition-colors ${
                    active
                      ? "bg-cream/10 text-cream border-l-2 border-gold"
                      : "text-cream/70 hover:text-cream hover:bg-cream/5"
                  }`}
                >
                  <span className="font-heading tracking-wide">{item.label}</span>
                  <span className="font-hand text-sm text-gold/70 ml-2">{item.hand}</span>
                </Link>
              );
            })}
          </nav>

          {/* user's own mini stack */}
          <div className="mt-auto pt-4 border-t border-cream/10">
            <p className="font-hand text-gold/80 text-lg mb-2">your spire</p>
            <Spire
              owner={currentUser}
              posts={myPosts.slice(0, 4)}
              people={myPeople}
              mini
              onOpenPost={setOpenPost}
              href="/me"
              nameOverride="you"
            />
          </div>
        </aside>

        {/* ---- mobile top bar ---- */}
        <header className="md:hidden sticky top-0 z-30 bg-night/95 backdrop-blur border-b border-cream/10 px-4 py-2.5 flex items-baseline justify-between">
          <Link href="/home" className="font-heading text-xl text-cream">
            Track Record
          </Link>
          <span className="font-hand text-gold/80 text-sm">you could write songs about this bs</span>
        </header>

        {/* ---- main ---- */}
        <main className="flex-1 min-w-0 pb-24 md:pb-8">{children}</main>

        {/* ---- mobile bottom nav ---- */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-night/95 backdrop-blur border-t border-cream/10 flex justify-around py-2">
          {NAV.slice(0, 5).map((item) => {
            const active = pathname?.startsWith(item.href);
            const short = item.href === "/me" ? "Mine" : item.label.split(" ")[0];
            const isNew = item.href === "/new";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center px-2 ${
                  isNew
                    ? "-mt-4"
                    : active
                      ? "text-gold"
                      : "text-cream/60"
                }`}
              >
                {isNew ? (
                  <span className="w-11 h-11 rounded-full btn-vintage flex items-center justify-center text-2xl font-heading border border-cream/20">
                    +
                  </span>
                ) : (
                  <>
                    <span className="font-heading text-sm">{short}</span>
                    <span className={`block w-1 h-1 rounded-full mt-0.5 ${active ? "bg-gold" : "bg-transparent"}`} />
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
