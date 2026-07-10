import type { DB, Post, Song } from "./types";
import { MOCK_SONGS } from "./songs";

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

function song(i: number): Song {
  return MOCK_SONGS[i % MOCK_SONGS.length];
}

/** One real Spotify track in the demo data so the embedded player is testable. */
export const SILVER_SPRINGS: Song = {
  spotifyId: "4nZi6XNe36Ut4Nij3IQ1yC",
  title: "Silver Springs - 2004 Remaster",
  artist: "Fleetwood Mac",
  album: "Rumours (Super Deluxe)",
  albumArtUrl: "https://i.scdn.co/image/ab67616d00001e02e52a59a28efa4773dd2bfe1b",
  externalUrl: "https://open.spotify.com/track/4nZi6XNe36Ut4Nij3IQ1yC",
};

function post(p: Omit<Post, "visibility" | "type"> & { type?: Post["type"] }): Post {
  return { visibility: "friends", type: p.eventType ? "standard_event" : "update", ...p };
}

/** Seed database: the test user + three demo friends with very different eras. */
export function buildSeedDB(): DB {
  return {
    users: [
      {
        id: "u_test",
        username: "test",
        displayName: "You",
        email: "test@trackrecord.app",
        password: "admin",
        spotifyConnected: false,
        createdAt: now - 90 * DAY,
      },
      {
        id: "u_june",
        username: "june",
        displayName: "June Marlowe",
        email: "june@trackrecord.app",
        spotifyConnected: true,
        createdAt: now - 200 * DAY,
      },
      {
        id: "u_margot",
        username: "margot",
        displayName: "Margot Vane",
        email: "margot@trackrecord.app",
        spotifyConnected: true,
        createdAt: now - 180 * DAY,
      },
      {
        id: "u_carmen",
        username: "carmen",
        displayName: "Carmen Solis",
        email: "carmen@trackrecord.app",
        spotifyConnected: false,
        createdAt: now - 160 * DAY,
      },
      {
        id: "u_priya",
        username: "priya",
        displayName: "Priya Nair",
        email: "priya@trackrecord.app",
        spotifyConnected: false,
        createdAt: now - 100 * DAY,
      },
      {
        id: "u_wren",
        username: "wren",
        displayName: "Wren Okafor",
        email: "wren@trackrecord.app",
        spotifyConnected: false,
        createdAt: now - 50 * DAY,
      },
    ],
    friendRequests: [
      { id: "fr_1", fromUserId: "u_test", toUserId: "u_june", status: "accepted", createdAt: now - 80 * DAY },
      { id: "fr_2", fromUserId: "u_margot", toUserId: "u_test", status: "accepted", createdAt: now - 75 * DAY },
      { id: "fr_3", fromUserId: "u_test", toUserId: "u_carmen", status: "accepted", createdAt: now - 70 * DAY },
      { id: "fr_4", fromUserId: "u_priya", toUserId: "u_test", status: "pending", createdAt: now - 2 * DAY },
    ],
    people: [
      // June: two at once — the mess
      { id: "p_theo", ownerUserId: "u_june", name: "Theo", nickname: "gallery guy", age: 29, city: "across town", metWhere: "a gallery opening", color: "olive", active: true, createdAt: now - 60 * DAY },
      { id: "p_dex", ownerUserId: "u_june", name: "Dex", nickname: "the bassist", age: 31, city: "never says", metWhere: "Hinge, allegedly", color: "burgundy", active: true, createdAt: now - 40 * DAY },
      // Margot: the promising one
      { id: "p_sam", ownerUserId: "u_margot", name: "Sam", nickname: "farmers market Sam", age: 30, city: "two streets over", metWhere: "the farmers market", color: "sage", firstDate: now - 55 * DAY, active: true, createdAt: now - 58 * DAY },
      // Carmen: the dramatic ending
      { id: "p_julian", ownerUserId: "u_carmen", name: "Julian", nickname: "him.", age: 33, city: "unfortunately nearby", metWhere: "a friend's birthday", color: "burnt", active: false, eraTitle: "A Vibe (Deluxe Edition)", createdAt: now - 120 * DAY },
      // Test user: partially filled stack
      { id: "p_alex", ownerUserId: "u_test", name: "Alex", nickname: "coffee shop Alex", city: "downtown", metWhere: "the coffee shop line", color: "gold", active: true, createdAt: now - 20 * DAY },
    ],
    posts: [
      // ---- June: messy situationship, two people ----
      post({ id: "po_j1", ownerUserId: "u_june", personIds: ["p_theo"], eventType: "first_date", title: "First date", text: "He talked about his ex for forty minutes but the wine was good.", moodIcon: "sprout", song: song(2), createdAt: now - 58 * DAY }),
      post({ id: "po_j2", ownerUserId: "u_june", personIds: ["p_theo"], eventType: "mixed_signals", title: "Mixed signals", text: "Likes every story. Answers none of the texts.", moodIcon: "moon", song: song(14), createdAt: now - 45 * DAY }),
      post({ id: "po_j3", ownerUserId: "u_june", personIds: ["p_dex"], eventType: "situationship", title: "Situationship detected", text: "He said 'labels are a construct' and I said 'so is rent' and honestly? We laughed.", moodIcon: "moon", song: song(8), createdAt: now - 32 * DAY }),
      post({ id: "po_j4", ownerUserId: "u_june", personIds: ["p_theo"], title: "He resurfaced.", text: "Three weeks of silence and then 'you up?' at 11:58pm. The audacity has its own gravitational field.", moodIcon: "lightning", song: song(5), createdAt: now - 18 * DAY }),
      post({ id: "po_j5", ownerUserId: "u_june", personIds: ["p_dex"], eventType: "sleepover", title: "Sleepover", text: "He made breakfast. It was one (1) egg. I'm choosing to see the effort.", moodIcon: "sun", song: song(26), createdAt: now - 9 * DAY }),
      post({ id: "po_j6", ownerUserId: "u_june", personIds: ["p_theo", "p_dex"], title: "They were at the same show.", text: "Both of them. Same venue. I hid by the merch table and texted the group chat like it was air traffic control.", moodIcon: "flame", song: SILVER_SPRINGS, createdAt: now - 6 * HOUR }),

      // ---- Margot: romantic and promising ----
      post({ id: "po_m1", ownerUserId: "u_margot", personIds: ["p_sam"], eventType: "first_date", title: "First date", text: "We closed the wine bar down. The waiter gave us free dessert because we 'looked like a movie.'", moodIcon: "rose", song: song(9), createdAt: now - 55 * DAY }),
      post({ id: "po_m2", ownerUserId: "u_margot", personIds: ["p_sam"], eventType: "we_clicked", title: "We clicked", text: "He remembered the name of my childhood dog. From a story I told once. In passing.", moodIcon: "star", song: song(10), createdAt: now - 48 * DAY }),
      post({ id: "po_m3", ownerUserId: "u_margot", personIds: ["p_sam"], eventType: "first_kiss", title: "First kiss", text: "Under the awning of the flower stand, obviously. The universe has a sense of set design.", moodIcon: "rose", song: song(0), createdAt: now - 41 * DAY }),
      post({ id: "po_m4", ownerUserId: "u_margot", personIds: ["p_sam"], eventType: "met_friends", title: "Met friends", text: "He brought a bottle of wine AND flowers for the host. The group chat has voted. It's unanimous.", moodIcon: "sun", song: song(21), createdAt: now - 20 * DAY }),
      post({ id: "po_m5", ownerUserId: "u_margot", personIds: ["p_sam"], title: "He planted herbs on my balcony.", text: "Basil, rosemary, thyme. He said 'for when I cook for you' — plural. Future tense. I had to sit down.", moodIcon: "sprout", song: song(22), createdAt: now - 1 * DAY }),

      // ---- Carmen: the dramatic ending ----
      post({ id: "po_c1", ownerUserId: "u_carmen", personIds: ["p_julian"], eventType: "we_clicked", title: "We clicked", text: "Four hours on a rooftop. He quoted my favorite film unprompted. I should have known it was foreshadowing.", moodIcon: "star", song: song(4), createdAt: now - 110 * DAY }),
      post({ id: "po_c2", ownerUserId: "u_carmen", personIds: ["p_julian"], eventType: "soft_launch", title: "Soft launch", text: "His hand. My candle. One story, 24 hours. The people noticed.", moodIcon: "eye", song: song(28), createdAt: now - 90 * DAY }),
      post({ id: "po_c3", ownerUserId: "u_carmen", personIds: ["p_julian"], eventType: "red_flag", title: "Red flag", text: "He referred to his ex as 'my Yoko.' I laughed then. I am not laughing now.", moodIcon: "flag", song: song(23), createdAt: now - 60 * DAY }),
      post({ id: "po_c4", ownerUserId: "u_carmen", personIds: ["p_julian"], eventType: "the_talk", title: "The talk", text: "I asked what we were. He said 'a vibe.' A VIBE. I have named playlists with more commitment.", moodIcon: "flame", song: song(24), createdAt: now - 30 * DAY }),
      post({ id: "po_c5", ownerUserId: "u_carmen", personIds: ["p_julian"], eventType: "it_ended", title: "It ended", text: "On a Tuesday. In the rain. He kept my tote bag and I kept my dignity, which feels like an uneven trade.", moodIcon: "brokenheart", song: song(15), createdAt: now - 12 * DAY }),
      post({ id: "po_c6", ownerUserId: "u_carmen", personIds: ["p_julian"], eventType: "no_contact", title: "No contact", text: "Day 11. He viewed my story from a burner account named after his dog. I am thriving. This is what thriving looks like.", moodIcon: "key", song: song(19), createdAt: now - 10 * HOUR }),

      // ---- Test user: partially filled ----
      post({ id: "po_t1", ownerUserId: "u_test", personIds: ["p_alex"], eventType: "first_date", title: "First date", text: "Coffee turned into a walk turned into dinner. Suspiciously easy.", moodIcon: "sprout", song: song(13), createdAt: now - 15 * DAY }),
      post({ id: "po_t2", ownerUserId: "u_test", personIds: ["p_alex"], title: "He knows my order now.", text: "Oat flat white, extra shot. He started making it when I walk in. The baristas have opinions.", moodIcon: "sun", song: song(3), createdAt: now - 4 * DAY }),
    ],
    comments: [
      { id: "c_1", postId: "po_j6", userId: "u_margot", text: "AIR TRAFFIC CONTROL. I'm framing this.", createdAt: now - 5 * HOUR },
      { id: "c_2", postId: "po_j6", userId: "u_carmen", text: "you need to charge admission for this timeline", createdAt: now - 4 * HOUR },
      { id: "c_3", postId: "po_c6", userId: "u_june", text: "the dog account is INSANE behavior. stay strong", createdAt: now - 8 * HOUR },
      { id: "c_4", postId: "po_m5", userId: "u_june", text: "plural?? future tense?? marry the herb man", createdAt: now - 20 * HOUR },
    ],
    reactions: [
      { id: "r_1", postId: "po_j6", userId: "u_margot", type: "screaming", createdAt: now - 5 * HOUR },
      { id: "r_2", postId: "po_j6", userId: "u_carmen", type: "iconic", createdAt: now - 4 * HOUR },
      { id: "r_3", postId: "po_c5", userId: "u_june", type: "crying", createdAt: now - 11 * DAY },
      { id: "r_4", postId: "po_c5", userId: "u_margot", type: "call_me", createdAt: now - 11 * DAY },
      { id: "r_5", postId: "po_m5", userId: "u_carmen", type: "finally", createdAt: now - 19 * HOUR },
      { id: "r_6", postId: "po_c3", userId: "u_june", type: "red_flag", createdAt: now - 59 * DAY },
    ],
    seen: {
      u_test: {
        u_june: now - 2 * DAY, // june has newer posts -> unseen
        u_margot: now - 2 * DAY, // margot posted 1 day ago -> unseen
        u_carmen: now - 12 * DAY, // carmen posted since -> unseen
      },
    },
  };
}
