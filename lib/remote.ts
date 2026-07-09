"use client";

import type { Comment, DB, FriendRequest, Person, Post, Reaction, User } from "./types";
import { getSupabase } from "./supabase";

/**
 * Supabase persistence for the data layer.
 *
 * db.ts keeps the same in-memory DB snapshot and selectors in both modes;
 * this module loads the signed-in user's visible world (their rows plus
 * accepted friends' rows — RLS enforces the same boundary server-side) and
 * mirrors each local mutation to Supabase.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------- row <-> type mapping ----------

function rowToUser(r: any): User {
  return {
    id: r.id,
    username: r.username,
    displayName: r.display_name,
    email: r.email,
    profilePictureUrl: r.profile_picture_url ?? undefined,
    spotifyConnected: r.spotify_connected,
    createdAt: Number(r.created_at),
  };
}

function rowToRequest(r: any): FriendRequest {
  return {
    id: r.id,
    fromUserId: r.from_user_id,
    toUserId: r.to_user_id,
    status: r.status,
    createdAt: Number(r.created_at),
  };
}

function rowToPerson(r: any): Person {
  return {
    id: r.id,
    ownerUserId: r.owner_user_id,
    name: r.name,
    age: r.age ?? undefined,
    city: r.city ?? undefined,
    metWhere: r.met_where ?? undefined,
    nickname: r.nickname ?? undefined,
    firstDate: r.first_date != null ? Number(r.first_date) : undefined,
    color: r.color,
    active: r.active,
    createdAt: Number(r.created_at),
  };
}

function personToRow(p: Person): any {
  return {
    id: p.id,
    owner_user_id: p.ownerUserId,
    name: p.name,
    age: p.age ?? null,
    city: p.city ?? null,
    met_where: p.metWhere ?? null,
    nickname: p.nickname ?? null,
    first_date: p.firstDate ?? null,
    color: p.color,
    active: p.active,
    created_at: p.createdAt,
  };
}

function rowToPost(r: any): Post {
  return {
    id: r.id,
    ownerUserId: r.owner_user_id,
    personIds: r.person_ids ?? [],
    type: r.type,
    eventType: r.event_type ?? undefined,
    title: r.title,
    text: r.body ?? undefined,
    moodIcon: r.mood_icon,
    song: r.song,
    visibility: "friends",
    createdAt: Number(r.created_at),
    dateOverride: r.date_override != null ? Number(r.date_override) : undefined,
  };
}

function postToRow(p: Post): any {
  return {
    id: p.id,
    owner_user_id: p.ownerUserId,
    person_ids: p.personIds,
    type: p.type,
    event_type: p.eventType ?? null,
    title: p.title,
    body: p.text ?? null,
    mood_icon: p.moodIcon,
    song: p.song,
    visibility: "friends",
    created_at: p.createdAt,
    date_override: p.dateOverride ?? null,
  };
}

function rowToComment(r: any): Comment {
  return { id: r.id, postId: r.post_id, userId: r.user_id, text: r.body, createdAt: Number(r.created_at) };
}

function rowToReaction(r: any): Reaction {
  return { id: r.id, postId: r.post_id, userId: r.user_id, type: r.type, createdAt: Number(r.created_at) };
}

// ---------- session ----------

export async function remoteSessionUserId(): Promise<string | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.user.id ?? null;
}

export function onRemoteSignOut(cb: () => void) {
  getSupabase().auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") cb();
  });
}

// ---------- auth ----------

export async function remoteLogin(
  usernameOrEmail: string,
  password: string
): Promise<{ ok: boolean; error?: string; userId?: string }> {
  const sb = getSupabase();
  let email = usernameOrEmail.trim();
  if (!email.includes("@")) {
    const { data } = await sb.rpc("get_email_for_username", { uname: email });
    if (!data) return { ok: false, error: "No one by that name in the liner notes." };
    email = data as string;
  }
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return { ok: false, error: "Wrong password (or unconfirmed email). The lore stays locked." };
  }
  return { ok: true, userId: data.session.user.id };
}

export async function remoteSignup(input: {
  displayName: string;
  username: string;
  email: string;
  password: string;
  profilePictureUrl?: string;
}): Promise<{ ok: boolean; error?: string; userId?: string; user?: User }> {
  const sb = getSupabase();
  const uname = input.username.trim().toLowerCase();

  const { data: taken } = await sb.rpc("get_email_for_username", { uname });
  if (taken) return { ok: false, error: "That username is already on the record." };

  const { data, error } = await sb.auth.signUp({ email: input.email.trim(), password: input.password });
  if (error) return { ok: false, error: error.message };
  if (!data.session || !data.user) {
    return { ok: false, error: "Account created — confirm your email, then log in." };
  }

  const user: User = {
    id: data.user.id,
    username: uname,
    displayName: input.displayName.trim(),
    email: input.email.trim(),
    profilePictureUrl: input.profilePictureUrl,
    spotifyConnected: false,
    createdAt: Date.now(),
  };
  const { error: profileError } = await sb.from("profiles").insert({
    id: user.id,
    username: user.username,
    display_name: user.displayName,
    email: user.email,
    profile_picture_url: user.profilePictureUrl ?? null,
    spotify_connected: false,
    created_at: user.createdAt,
  });
  if (profileError) return { ok: false, error: profileError.message };
  return { ok: true, userId: user.id, user };
}

export async function remoteLogout(): Promise<void> {
  await getSupabase().auth.signOut();
}

// ---------- reads ----------

/** Load everything the signed-in user can see into one DB snapshot. */
export async function fetchRemoteDB(userId: string): Promise<DB> {
  const sb = getSupabase();

  const { data: frRows } = await sb
    .from("friend_requests")
    .select("*")
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
  const requests = (frRows ?? []).map(rowToRequest);

  const friendIds = requests
    .filter((r) => r.status === "accepted")
    .map((r) => (r.fromUserId === userId ? r.toUserId : r.fromUserId));
  const partyIds = Array.from(
    new Set([userId, ...requests.flatMap((r) => [r.fromUserId, r.toUserId])])
  );
  const ownerIds = [userId, ...friendIds];

  const [{ data: profileRows }, { data: peopleRows }, { data: postRows }, { data: seenRows }] =
    await Promise.all([
      sb.from("profiles").select("*").in("id", partyIds),
      sb.from("people").select("*").in("owner_user_id", ownerIds),
      sb.from("posts").select("*").in("owner_user_id", ownerIds),
      sb.from("seen_marks").select("*").eq("viewer_id", userId),
    ]);

  const posts = (postRows ?? []).map(rowToPost);
  const postIds = posts.map((p) => p.id);

  let comments: Comment[] = [];
  let reactions: Reaction[] = [];
  if (postIds.length > 0) {
    const [{ data: commentRows }, { data: reactionRows }] = await Promise.all([
      sb.from("comments").select("*").in("post_id", postIds),
      sb.from("reactions").select("*").in("post_id", postIds),
    ]);
    comments = (commentRows ?? []).map(rowToComment);
    reactions = (reactionRows ?? []).map(rowToReaction);
  }

  const seen: DB["seen"] = { [userId]: {} };
  for (const row of seenRows ?? []) {
    seen[userId][row.friend_id] = Number(row.last_seen);
  }

  return {
    users: (profileRows ?? []).map(rowToUser),
    friendRequests: requests,
    people: (peopleRows ?? []).map(rowToPerson),
    posts,
    comments,
    reactions,
    seen,
  };
}

export async function remoteSearchUsers(query: string, exceptUserId: string): Promise<User[]> {
  const q = query.trim();
  if (!q) return [];
  const { data } = await getSupabase()
    .from("profiles")
    .select("*")
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .neq("id", exceptUserId)
    .limit(10);
  return (data ?? []).map(rowToUser);
}

// ---------- writes (mirrored after optimistic local mutations) ----------

function logError(op: string) {
  return ({ error }: { error: any }) => {
    if (error) console.error(`[track-record] remote ${op} failed:`, error.message ?? error);
  };
}

export function remoteUpdateProfile(userId: string, patch: Partial<User>) {
  const row: any = {};
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.profilePictureUrl !== undefined) row.profile_picture_url = patch.profilePictureUrl;
  if (patch.spotifyConnected !== undefined) row.spotify_connected = patch.spotifyConnected;
  void getSupabase().from("profiles").update(row).eq("id", userId).then(logError("updateProfile"));
}

export function remoteSendFriendRequest(r: FriendRequest) {
  void getSupabase()
    .from("friend_requests")
    .insert({ id: r.id, from_user_id: r.fromUserId, to_user_id: r.toUserId, status: r.status, created_at: r.createdAt })
    .then(logError("sendFriendRequest"));
}

export function remoteRespondToRequest(requestId: string, status: "accepted" | "rejected") {
  void getSupabase().from("friend_requests").update({ status }).eq("id", requestId).then(logError("respondToRequest"));
}

export function remoteRemoveFriend(userId: string, friendId: string) {
  void getSupabase()
    .from("friend_requests")
    .delete()
    .eq("status", "accepted")
    .or(
      `and(from_user_id.eq.${userId},to_user_id.eq.${friendId}),and(from_user_id.eq.${friendId},to_user_id.eq.${userId})`
    )
    .then(logError("removeFriend"));
}

export function remoteCreatePerson(p: Person) {
  void getSupabase().from("people").insert(personToRow(p)).then(logError("createPerson"));
}

export function remoteUpdatePerson(p: Person) {
  void getSupabase().from("people").update(personToRow(p)).eq("id", p.id).then(logError("updatePerson"));
}

export function remoteDeletePerson(personId: string, deletedPostIds: string[], updatedPosts: Post[]) {
  const sb = getSupabase();
  if (deletedPostIds.length > 0) {
    void sb.from("posts").delete().in("id", deletedPostIds).then(logError("deletePerson/posts"));
  }
  for (const post of updatedPosts) {
    void sb.from("posts").update({ person_ids: post.personIds }).eq("id", post.id).then(logError("deletePerson/update"));
  }
  void sb.from("people").delete().eq("id", personId).then(logError("deletePerson"));
}

export function remoteCreatePost(p: Post) {
  void getSupabase().from("posts").insert(postToRow(p)).then(logError("createPost"));
}

export function remoteDeletePost(postId: string) {
  void getSupabase().from("posts").delete().eq("id", postId).then(logError("deletePost"));
}

export function remoteAddComment(c: Comment) {
  void getSupabase()
    .from("comments")
    .insert({ id: c.id, post_id: c.postId, user_id: c.userId, body: c.text, created_at: c.createdAt })
    .then(logError("addComment"));
}

export function remoteAddReaction(r: Reaction) {
  void getSupabase()
    .from("reactions")
    .insert({ id: r.id, post_id: r.postId, user_id: r.userId, type: r.type, created_at: r.createdAt })
    .then(logError("addReaction"));
}

export function remoteRemoveReaction(reactionId: string) {
  void getSupabase().from("reactions").delete().eq("id", reactionId).then(logError("removeReaction"));
}

export function remoteMarkSeen(viewerId: string, friendId: string, lastSeen: number) {
  void getSupabase()
    .from("seen_marks")
    .upsert({ viewer_id: viewerId, friend_id: friendId, last_seen: lastSeen })
    .then(logError("markSeen"));
}
