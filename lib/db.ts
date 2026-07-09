"use client";

import { useSyncExternalStore } from "react";
import type { Comment, DB, FriendRequest, Person, Post, Reaction, User } from "./types";
import { postDate } from "./types";
import { buildSeedDB, SILVER_SPRINGS } from "./seed";
import { nextFreeColor } from "./colors";
import { supabaseConfigured } from "./supabase";
import * as remote from "./remote";

/**
 * Data layer with two backends behind one API:
 *
 * - Local demo mode (no env vars): everything lives in localStorage, seeded
 *   with demo data; the test/admin login works.
 * - Supabase mode (NEXT_PUBLIC_SUPABASE_URL + ANON_KEY set): real auth and a
 *   shared database. The visible world is loaded into the same in-memory DB
 *   snapshot, selectors are identical, and every mutation is applied
 *   optimistically then mirrored to Supabase (see lib/remote.ts). Row Level
 *   Security enforces the friends-only boundary server-side.
 */

const DB_KEY = "track-record:db:v1";
const SESSION_KEY = "track-record:session:v1";

const REMOTE = supabaseConfigured();

let db: DB | null = null;
let sessionUserId: string | null = null;
let ready = false;
let hydrated = false;
const listeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== "undefined";
}

const emptyDB = (): DB => ({
  users: [],
  friendRequests: [],
  people: [],
  posts: [],
  comments: [],
  reactions: [],
  seen: {},
});

// ---------- hydration ----------

function hydrate() {
  if (hydrated || !isBrowser()) return;
  hydrated = true;
  if (REMOTE) {
    db = emptyDB();
    void initRemote();
  } else {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(DB_KEY);
      db = raw ? (JSON.parse(raw) as DB) : buildSeedDB();
    } catch {
      db = buildSeedDB();
    }
    if (!raw) persistLocal();
    migrateLocal();
    sessionUserId = window.localStorage.getItem(SESSION_KEY);
    ready = true;
  }
}

async function initRemote() {
  sessionUserId = await remote.remoteSessionUserId();
  if (sessionUserId) {
    try {
      db = await remote.fetchRemoteDB(sessionUserId);
    } catch (e) {
      console.error("[track-record] failed to load data:", e);
    }
  }
  ready = true;
  emit();

  remote.onRemoteSignOut(() => {
    sessionUserId = null;
    db = emptyDB();
    emit();
  });

  // pick up friends' new posts when the tab regains focus (max every 15s)
  let lastRefetch = Date.now();
  window.addEventListener("focus", () => {
    if (!sessionUserId || Date.now() - lastRefetch < 15_000) return;
    lastRefetch = Date.now();
    void refetchRemote();
  });
}

async function refetchRemote() {
  if (!REMOTE || !sessionUserId) return;
  try {
    db = await remote.fetchRemoteDB(sessionUserId);
    emit();
  } catch {
    /* transient network issue — keep the current snapshot */
  }
}

/** In-place fixups for local databases seeded by older versions of the app. */
function migrateLocal() {
  if (!db) return;
  const juneTop = db.posts.find((p) => p.id === "po_j6");
  if (juneTop && !juneTop.song.spotifyId) {
    juneTop.song = SILVER_SPRINGS;
    persistLocal();
  }
}

function persistLocal() {
  if (REMOTE || !isBrowser() || !db) return;
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // storage full/blocked — keep working in memory
  }
}

function emit() {
  persistLocal();
  snapshotCache = null;
  for (const l of listeners) l();
}

function getDB(): DB {
  hydrate();
  if (!db) db = REMOTE ? emptyDB() : buildSeedDB();
  return db;
}

// ---------- React subscription ----------

export interface Snapshot {
  db: DB;
  currentUser: User | null;
  /** false until the session (and in Supabase mode, the data) has loaded */
  ready: boolean;
}

let snapshotCache: Snapshot | null = null;
const serverSnapshot: Snapshot = { db: emptyDB(), currentUser: null, ready: false };

function getSnapshot(): Snapshot {
  hydrate();
  if (!snapshotCache) {
    const d = getDB();
    snapshotCache = {
      db: d,
      currentUser: d.users.find((u) => u.id === sessionUserId) ?? null,
      ready,
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

/** True when the app runs against Supabase instead of the local demo store. */
export function usingSupabase(): boolean {
  return REMOTE;
}

// ---------- helpers ----------

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- auth ----------

export async function login(
  usernameOrEmail: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  if (REMOTE) {
    const res = await remote.remoteLogin(usernameOrEmail, password);
    if (!res.ok) return res;
    sessionUserId = res.userId!;
    await refetchRemote();
    return { ok: true };
  }

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

export async function signup(input: {
  displayName: string;
  username: string;
  email: string;
  password: string;
  profilePictureUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!input.username.trim() || !input.displayName.trim() || !input.email.trim() || !input.password) {
    return { ok: false, error: "Every field wants a verse. Fill them in." };
  }

  if (REMOTE) {
    const res = await remote.remoteSignup(input);
    if (!res.ok) return res;
    sessionUserId = res.userId!;
    const d = getDB();
    if (res.user) d.users.push(res.user);
    emit();
    return { ok: true };
  }

  const d = getDB();
  const uname = input.username.trim().toLowerCase();
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

export async function logout(): Promise<void> {
  if (REMOTE) {
    await remote.remoteLogout();
    sessionUserId = null;
    db = emptyDB();
    emit();
    return;
  }
  sessionUserId = null;
  if (isBrowser()) window.localStorage.removeItem(SESSION_KEY);
  emit();
}

export function updateProfile(
  userId: string,
  patch: Partial<Pick<User, "displayName" | "profilePictureUrl" | "spotifyConnected">>
) {
  const d = getDB();
  const u = d.users.find((x) => x.id === userId);
  if (!u) return;
  Object.assign(u, patch);
  emit();
  if (REMOTE) remote.remoteUpdateProfile(userId, patch);
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

/** Search users by name. Local mode filters the seed; Supabase mode queries. */
export async function searchUsersAsync(query: string, exceptUserId: string): Promise<User[]> {
  if (REMOTE) return remote.remoteSearchUsers(query, exceptUserId);
  const d = getDB();
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
  const request: FriendRequest = {
    id: uid("fr"),
    fromUserId,
    toUserId,
    status: "pending",
    createdAt: Date.now(),
  };
  d.friendRequests.push(request);
  emit();
  if (REMOTE) remote.remoteSendFriendRequest(request);
}

export function respondToRequest(requestId: string, status: "accepted" | "rejected") {
  const d = getDB();
  const r = d.friendRequests.find((x) => x.id === requestId);
  if (!r) return;
  r.status = status;
  emit();
  if (REMOTE) {
    remote.remoteRespondToRequest(requestId, status);
    // accepting a friend unlocks their timeline — pull it in
    if (status === "accepted") void refetchRemote();
  }
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
  if (REMOTE) remote.remoteRemoveFriend(userId, friendId);
}

// ---------- people ----------

export function peopleOf(d: DB, userId: string): Person[] {
  return d.people.filter((p) => p.ownerUserId === userId);
}

export function createPerson(
  input: Omit<Person, "id" | "createdAt" | "color" | "active"> & { color?: string }
): Person {
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
  if (REMOTE) remote.remoteCreatePerson(person);
  return person;
}

export function updatePerson(personId: string, patch: Partial<Person>) {
  const d = getDB();
  const p = d.people.find((x) => x.id === personId);
  if (!p) return;
  Object.assign(p, patch);
  emit();
  if (REMOTE) remote.remoteUpdatePerson(p);
}

export function deletePerson(personId: string) {
  const d = getDB();
  const deletedPostIds = d.posts
    .filter((po) => po.personIds.length === 1 && po.personIds[0] === personId)
    .map((po) => po.id);
  const updatedPosts = d.posts.filter(
    (po) => po.personIds.includes(personId) && po.personIds.length > 1
  );

  d.people = d.people.filter((p) => p.id !== personId);
  d.posts = d.posts.filter((po) => !deletedPostIds.includes(po.id));
  updatedPosts.forEach((po) => (po.personIds = po.personIds.filter((id) => id !== personId)));
  emit();
  if (REMOTE) remote.remoteDeletePerson(personId, deletedPostIds, updatedPosts);
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
  if (REMOTE) remote.remoteCreatePost(post);
  return post;
}

export function deletePost(postId: string) {
  const d = getDB();
  d.posts = d.posts.filter((p) => p.id !== postId);
  d.comments = d.comments.filter((c) => c.postId !== postId);
  d.reactions = d.reactions.filter((r) => r.postId !== postId);
  emit();
  if (REMOTE) remote.remoteDeletePost(postId);
}

// ---------- comments & reactions ----------

export function addComment(postId: string, userId: string, text: string) {
  const d = getDB();
  if (!text.trim()) return;
  const comment: Comment = { id: uid("c"), postId, userId, text: text.trim(), createdAt: Date.now() };
  d.comments.push(comment);
  emit();
  if (REMOTE) remote.remoteAddComment(comment);
}

export function toggleReaction(postId: string, userId: string, type: string) {
  const d = getDB();
  const existing = d.reactions.find((r) => r.postId === postId && r.userId === userId && r.type === type);
  if (existing) {
    d.reactions = d.reactions.filter((r) => r.id !== existing.id);
    emit();
    if (REMOTE) remote.remoteRemoveReaction(existing.id);
  } else {
    const reaction: Reaction = { id: uid("r"), postId, userId, type, createdAt: Date.now() };
    d.reactions.push(reaction);
    emit();
    if (REMOTE) remote.remoteAddReaction(reaction);
  }
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
  const now = Date.now();
  if (!d.seen[viewerId]) d.seen[viewerId] = {};
  d.seen[viewerId][friendId] = now;
  emit();
  if (REMOTE) remote.remoteMarkSeen(viewerId, friendId, now);
}

// ---------- demo ----------

/** Reset everything back to the seeded demo state. Local demo mode only. */
export function resetDemoData() {
  if (REMOTE) return;
  db = buildSeedDB();
  if (sessionUserId && !db.users.some((u) => u.id === sessionUserId)) {
    sessionUserId = null;
    if (isBrowser()) window.localStorage.removeItem(SESSION_KEY);
  }
  emit();
}
