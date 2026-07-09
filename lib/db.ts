"use client";

import { useSyncExternalStore } from "react";
import type { Comment, DB, FriendRequest, Person, Post, Reaction, User } from "./types";
import { postDate } from "./types";
import { buildSeedDB, SILVER_SPRINGS } from "./seed";
import { nextFreeColor } from "./colors";

/**
 * Local-first database abstraction.
 *
 * Everything goes through this module, so swapping in Supabase/Firestore later
 * means reimplementing these functions — the UI never touches storage directly.
 * State persists to localStorage and is seeded with demo data on first run.
 */

const DB_KEY = "track-record:db:v1";
const SESSION_KEY = "track-record:session:v1";

let db: DB | null = null;
let sessionUserId: string | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== "undefined";
}

function hydrate() {
  if (hydrated || !isBrowser()) return;
  hydrated = true;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(DB_KEY);
    db = raw ? (JSON.parse(raw) as DB) : buildSeedDB();
  } catch {
    db = buildSeedDB();
  }
  if (!raw) persist();
  migrate();
  sessionUserId = window.localStorage.getItem(SESSION_KEY);
}

/** In-place fixups for databases seeded by older versions of the app. */
function migrate() {
  if (!db) return;
  // v1 seeds gave June's newest post a mock song; swap in the real Spotify
  // track so the embedded player is testable without resetting demo data.
  const juneTop = db.posts.find((p) => p.id === "po_j6");
  if (juneTop && !juneTop.song.spotifyId) {
    juneTop.song = SILVER_SPRINGS;
    persist();
  }
}

function persist() {
  if (!isBrowser() || !db) return;
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // storage full/blocked — keep working in memory
  }
}

function emit() {
  persist();
  snapshotCache = null;
  for (const l of listeners) l();
}

function getDB(): DB {
  hydrate();
  if (!db) db = buildSeedDB();
  return db;
}

// ---------- React subscription ----------

export interface Snapshot {
  db: DB;
  currentUser: User | null;
}

let snapshotCache: Snapshot | null = null;
const emptyDB: DB = { users: [], friendRequests: [], people: [], posts: [], comments: [], reactions: [], seen: {} };
const serverSnapshot: Snapshot = { db: emptyDB, currentUser: null };

function getSnapshot(): Snapshot {
  hydrate();
  if (!snapshotCache) {
    const d = getDB();
    snapshotCache = {
      db: d,
      currentUser: d.users.find((u) => u.id === sessionUserId) ?? null,
    };
  }
  return snapshotCache;
}

export function useStore(): Snapshot {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSnapshot,
    () => serverSnapshot
  );
}

// ---------- helpers ----------

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- auth ----------

export function login(usernameOrEmail: string, password: string): { ok: boolean; error?: string } {
  const d = getDB();
  const q = usernameOrEmail.trim().toLowerCase();
  const user = d.users.find(
    (u) => u.username.toLowerCase() === q || u.email.toLowerCase() === q
  );
  if (!user) return { ok: false, error: "No one by that name in the liner notes." };
  // Fallback test login always works; seeded demo users have no password.
  const expected = user.password ?? "admin";
  if (password !== expected) return { ok: false, error: "Wrong password. The lore stays locked." };
  sessionUserId = user.id;
  if (isBrowser()) window.localStorage.setItem(SESSION_KEY, user.id);
  emit();
  return { ok: true };
}

export function signup(input: {
  displayName: string;
  username: string;
  email: string;
  password: string;
  profilePictureUrl?: string;
}): { ok: boolean; error?: string } {
  const d = getDB();
  const uname = input.username.trim().toLowerCase();
  if (!uname || !input.displayName.trim() || !input.email.trim() || !input.password) {
    return { ok: false, error: "Every field wants a verse. Fill them in." };
  }
  if (d.users.some((u) => u.username.toLowerCase() === uname)) {
    return { ok: false, error: "That username is already on the record." };
  }
  const user: User = {
    id: uid("u"),
    username: uname,
    displayName: input.displayName.trim(),
    email: input.email.trim(),
    password: input.password,
    profilePictureUrl: input.profilePictureUrl,
    spotifyConnected: false,
    createdAt: Date.now(),
  };
  d.users.push(user);
  sessionUserId = user.id;
  if (isBrowser()) window.localStorage.setItem(SESSION_KEY, user.id);
  emit();
  return { ok: true };
}

export function logout() {
  sessionUserId = null;
  if (isBrowser()) window.localStorage.removeItem(SESSION_KEY);
  emit();
}

export function updateProfile(userId: string, patch: Partial<Pick<User, "displayName" | "profilePictureUrl" | "spotifyConnected">>) {
  const d = getDB();
  const u = d.users.find((x) => x.id === userId);
  if (!u) return;
  Object.assign(u, patch);
  emit();
}

// ---------- friends ----------

export function friendsOf(d: DB, userId: string): User[] {
  const ids = d.friendRequests
    .filter((r) => r.status === "accepted" && (r.fromUserId === userId || r.toUserId === userId))
    .map((r) => (r.fromUserId === userId ? r.toUserId : r.fromUserId));
  return d.users.filter((u) => ids.includes(u.id));
}

export function pendingRequestsFor(d: DB, userId: string): FriendRequest[] {
  return d.friendRequests.filter((r) => r.status === "pending" && r.toUserId === userId);
}

export function outgoingRequestsFrom(d: DB, userId: string): FriendRequest[] {
  return d.friendRequests.filter((r) => r.status === "pending" && r.fromUserId === userId);
}

export function searchUsers(d: DB, query: string, exceptUserId: string): User[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return d.users.filter(
    (u) =>
      u.id !== exceptUserId &&
      (u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q))
  );
}

export function sendFriendRequest(fromUserId: string, toUserId: string) {
  const d = getDB();
  const exists = d.friendRequests.some(
    (r) =>
      r.status !== "rejected" &&
      ((r.fromUserId === fromUserId && r.toUserId === toUserId) ||
        (r.fromUserId === toUserId && r.toUserId === fromUserId))
  );
  if (exists) return;
  d.friendRequests.push({ id: uid("fr"), fromUserId, toUserId, status: "pending", createdAt: Date.now() });
  emit();
}

export function respondToRequest(requestId: string, status: "accepted" | "rejected") {
  const d = getDB();
  const r = d.friendRequests.find((x) => x.id === requestId);
  if (!r) return;
  r.status = status;
  emit();
}

export function removeFriend(userId: string, friendId: string) {
  const d = getDB();
  d.friendRequests = d.friendRequests.filter(
    (r) =>
      !(
        r.status === "accepted" &&
        ((r.fromUserId === userId && r.toUserId === friendId) ||
          (r.fromUserId === friendId && r.toUserId === userId))
      )
  );
  emit();
}

// ---------- people ----------

export function peopleOf(d: DB, userId: string): Person[] {
  return d.people.filter((p) => p.ownerUserId === userId);
}

export function createPerson(input: Omit<Person, "id" | "createdAt" | "color" | "active"> & { color?: string }): Person {
  const d = getDB();
  const usedColors = peopleOf(d, input.ownerUserId).map((p) => p.color);
  const person: Person = {
    ...input,
    id: uid("p"),
    color: input.color && !usedColors.includes(input.color) ? input.color : nextFreeColor(usedColors),
    active: true,
    createdAt: Date.now(),
  };
  d.people.push(person);
  emit();
  return person;
}

export function updatePerson(personId: string, patch: Partial<Person>) {
  const d = getDB();
  const p = d.people.find((x) => x.id === personId);
  if (!p) return;
  Object.assign(p, patch);
  emit();
}

export function deletePerson(personId: string) {
  const d = getDB();
  d.people = d.people.filter((p) => p.id !== personId);
  d.posts = d.posts.filter((po) => !(po.personIds.length === 1 && po.personIds[0] === personId));
  d.posts.forEach((po) => (po.personIds = po.personIds.filter((id) => id !== personId)));
  emit();
}

// ---------- posts ----------

export function postsOf(d: DB, userId: string): Post[] {
  return d.posts
    .filter((p) => p.ownerUserId === userId)
    .sort((a, b) => postDate(b) - postDate(a));
}

export function createPost(input: Omit<Post, "id" | "createdAt" | "visibility">): Post {
  const d = getDB();
  const post: Post = { ...input, id: uid("po"), visibility: "friends", createdAt: Date.now() };
  d.posts.push(post);
  emit();
  return post;
}

export function deletePost(postId: string) {
  const d = getDB();
  d.posts = d.posts.filter((p) => p.id !== postId);
  d.comments = d.comments.filter((c) => c.postId !== postId);
  d.reactions = d.reactions.filter((r) => r.postId !== postId);
  emit();
}

// ---------- comments & reactions ----------

export function addComment(postId: string, userId: string, text: string) {
  const d = getDB();
  if (!text.trim()) return;
  d.comments.push({ id: uid("c"), postId, userId, text: text.trim(), createdAt: Date.now() });
  emit();
}

export function toggleReaction(postId: string, userId: string, type: string) {
  const d = getDB();
  const existing = d.reactions.find((r) => r.postId === postId && r.userId === userId && r.type === type);
  if (existing) {
    d.reactions = d.reactions.filter((r) => r.id !== existing.id);
  } else {
    d.reactions.push({ id: uid("r"), postId, userId, type, createdAt: Date.now() });
  }
  emit();
}

export function commentsOf(d: DB, postId: string): Comment[] {
  return d.comments.filter((c) => c.postId === postId).sort((a, b) => a.createdAt - b.createdAt);
}

export function reactionsOf(d: DB, postId: string): Reaction[] {
  return d.reactions.filter((r) => r.postId === postId);
}

// ---------- seen / unseen ----------

export function hasUnseen(d: DB, viewerId: string, friendId: string): boolean {
  const posts = postsOf(d, friendId);
  if (posts.length === 0) return false;
  const lastSeen = d.seen[viewerId]?.[friendId] ?? 0;
  return posts[0].createdAt > lastSeen;
}

export function markSeen(viewerId: string, friendId: string) {
  const d = getDB();
  if (!hasUnseen(d, viewerId, friendId)) return;
  if (!d.seen[viewerId]) d.seen[viewerId] = {};
  d.seen[viewerId][friendId] = Date.now();
  emit();
}

/** Reset everything back to the seeded demo state. */
export function resetDemoData() {
  db = buildSeedDB();
  if (sessionUserId && !db.users.some((u) => u.id === sessionUserId)) {
    sessionUserId = null;
    if (isBrowser()) window.localStorage.removeItem(SESSION_KEY);
  }
  emit();
}
