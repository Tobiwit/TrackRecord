export type ID = string;

export interface User {
  id: ID;
  username: string;
  displayName: string;
  email: string;
  password?: string; // local demo mode only — never do this in production
  profilePictureUrl?: string;
  spotifyConnected: boolean;
  createdAt: number;
}

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export interface FriendRequest {
  id: ID;
  fromUserId: ID;
  toUserId: ID;
  status: FriendRequestStatus;
  createdAt: number;
}

export interface Person {
  id: ID;
  ownerUserId: ID;
  name: string;
  avatarUrl?: string;
  stylizedAvatarUrl?: string;
  age?: number;
  city?: string;
  metWhere?: string;
  nickname?: string;
  firstDate?: number;
  color: string; // accent color key, see lib/colors.ts
  active: boolean;
  createdAt: number;
}

export interface Song {
  spotifyId?: string;
  title: string;
  artist: string;
  album?: string;
  albumArtUrl?: string;
  previewUrl?: string;
  externalUrl?: string;
}

export type PostType = "update" | "standard_event";

export interface Post {
  id: ID;
  ownerUserId: ID;
  personIds: ID[];
  type: PostType;
  eventType?: string; // key into STANDARD_EVENTS when type === "standard_event"
  title: string;
  text?: string;
  moodIcon: string; // key into MOODS
  song: Song;
  visibility: "friends";
  createdAt: number;
  dateOverride?: number;
}

export interface Comment {
  id: ID;
  postId: ID;
  userId: ID;
  text: string;
  createdAt: number;
}

export interface Reaction {
  id: ID;
  postId: ID;
  userId: ID;
  type: string;
  createdAt: number;
}

export interface DB {
  users: User[];
  friendRequests: FriendRequest[];
  people: Person[];
  posts: Post[];
  comments: Comment[];
  reactions: Reaction[];
  /** per-user map of last-seen post timestamps per friend: seen[userId][friendId] = timestamp */
  seen: Record<ID, Record<ID, number>>;
}

export function postDate(p: Post): number {
  return p.dateOverride ?? p.createdAt;
}
