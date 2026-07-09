"use client";

import { useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { UserAvatar } from "@/components/Avatar";
import {
  friendsOf,
  outgoingRequestsFrom,
  pendingRequestsFor,
  postsOf,
  removeFriend,
  respondToRequest,
  searchUsers,
  sendFriendRequest,
  useStore,
} from "@/lib/db";
import { timeAgo } from "@/lib/format";

export default function FriendsPage() {
  return (
    <Shell>
      <FriendsInner />
    </Shell>
  );
}

function FriendsInner() {
  const { db, currentUser } = useStore();
  const [query, setQuery] = useState("");

  if (!currentUser) return null;

  const friends = friendsOf(db, currentUser.id).sort((a, b) => {
    const ap = postsOf(db, a.id)[0]?.createdAt ?? 0;
    const bp = postsOf(db, b.id)[0]?.createdAt ?? 0;
    return bp - ap;
  });
  const incoming = pendingRequestsFor(db, currentUser.id);
  const outgoing = outgoingRequestsFrom(db, currentUser.id);
  const results = searchUsers(db, query, currentUser.id);

  const friendIds = new Set(friends.map((f) => f.id));
  const pendingIds = new Set([...incoming.map((r) => r.fromUserId), ...outgoing.map((r) => r.toUserId)]);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h2 className="font-title text-3xl md:text-4xl text-ink">The Audience</h2>
      <p className="font-hand text-2xl text-sepia rotate-[-1.5deg] origin-left">only they get to hear the record</p>

      {/* search */}
      <div className="mt-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search by username or name…"
          className="vintage w-full rounded-sm px-3 py-2.5"
        />
        {query && (
          <div className="paper rounded-sm mt-2 divide-y divide-ink/10">
            {results.length === 0 && (
              <p className="p-4 text-sm text-ink-soft italic">Nobody by that name in the archive.</p>
            )}
            {results.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3">
                <UserAvatar user={u} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-ink">{u.displayName}</p>
                  <p className="text-xs text-ink-soft">@{u.username}</p>
                </div>
                {friendIds.has(u.id) ? (
                  <span className="text-xs text-espresso italic">already in the group</span>
                ) : pendingIds.has(u.id) ? (
                  <span className="text-xs text-espresso italic">invite pending</span>
                ) : (
                  <button
                    onClick={() => sendFriendRequest(currentUser.id, u.id)}
                    className="btn-vintage rounded-sm px-3 py-1.5 text-sm"
                  >
                    Invite
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* pending invites */}
      {(incoming.length > 0 || outgoing.length > 0) && (
        <section className="mt-8">
          <h3 className="font-heading text-2xl text-ink">Pending invites</h3>
          <div className="paper rounded-sm mt-2 divide-y divide-ink/10">
            {incoming.map((r) => {
              const from = db.users.find((u) => u.id === r.fromUserId);
              if (!from) return null;
              return (
                <div key={r.id} className="flex items-center gap-3 p-3">
                  <UserAvatar user={from} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-ink">{from.displayName}</p>
                    <p className="text-xs text-ink-soft">wants in on the lore · {timeAgo(r.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => respondToRequest(r.id, "accepted")}
                    className="btn-vintage rounded-sm px-3 py-1.5 text-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respondToRequest(r.id, "rejected")}
                    className="text-sm underline text-burgundy/80 hover:text-burgundy"
                  >
                    decline
                  </button>
                </div>
              );
            })}
            {outgoing.map((r) => {
              const to = db.users.find((u) => u.id === r.toUserId);
              if (!to) return null;
              return (
                <div key={r.id} className="flex items-center gap-3 p-3">
                  <UserAvatar user={to} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-ink">{to.displayName}</p>
                    <p className="text-xs text-ink-soft">invited {timeAgo(r.createdAt)} · no word yet</p>
                  </div>
                  <span className="text-xs text-espresso italic">waiting…</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* current friends */}
      <section className="mt-8">
        <h3 className="font-heading text-2xl text-ink">The group</h3>
        {friends.length === 0 ? (
          <div className="paper rounded-sm mt-2 p-6 text-center">
            <p className="font-hand text-xl text-sepia">
              No friends yet. The tea is going cold with no one to spill it to.
            </p>
          </div>
        ) : (
          <div className="paper rounded-sm mt-2 divide-y divide-ink/10">
            {friends.map((f) => {
              const last = postsOf(db, f.id)[0];
              return (
                <div key={f.id} className="flex items-center gap-3 p-3">
                  <UserAvatar user={f} size={38} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/u/${f.username}`} className="font-heading text-ink hover:text-burgundy">
                      {f.displayName}
                    </Link>
                    <p className="text-xs text-ink-soft">
                      @{f.username}
                      {last ? ` · last track ${timeAgo(last.createdAt)}` : " · quiet so far"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(`Remove ${f.displayName} from the group? They lose access to your record.`)) {
                        removeFriend(currentUser.id, f.id);
                      }
                    }}
                    className="text-xs underline text-burgundy/70 hover:text-burgundy"
                  >
                    remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
