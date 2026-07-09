import type { Song } from "./types";

/**
 * Mock song catalog used when Spotify is not configured.
 * All titles/artists are original inventions — vintage-flavored, no real tracks.
 */
export const MOCK_SONGS: Song[] = [
  { title: "Silver Springs Motel", artist: "The Velvet Omens", album: "Candle Season" },
  { title: "Landslide of My Own Making", artist: "Dust & Daisy", album: "Pressed Flowers" },
  { title: "Gold Dust Morning", artist: "Rosemary Quinn", album: "Kitchen Table Tarot" },
  { title: "Tell Me When It's Over", artist: "The Attic Choir", album: "Third Floor" },
  { title: "Rhiannon's Cousin", artist: "Meadowlark Motel", album: "Vacancy" },
  { title: "Don't Answer, It's Him", artist: "Petra & the Warnings", album: "Signal Fires" },
  { title: "Sleeping in My Makeup", artist: "Clementine Ash", album: "Late Checkout" },
  { title: "The Chain Reaction", artist: "Bramble Hill", album: "Thorn & Thread" },
  { title: "Reading His Horoscope", artist: "Luna Vell", album: "Retrograde Everything" },
  { title: "Seven Wonders of Him", artist: "The Foxglove Sisters", album: "Garden Party" },
  { title: "Crystal Visions (Of Us)", artist: "Opal Reyes", album: "Fortune Teller's Day Off" },
  { title: "Dreams Cost Extra", artist: "The Velvet Omens", album: "Candle Season" },
  { title: "Everywhere but Here", artist: "Dust & Daisy", album: "Pressed Flowers" },
  { title: "Gypsy Cab Home", artist: "Rosemary Quinn", album: "Kitchen Table Tarot" },
  { title: "Little Lies I Believed", artist: "Petra & the Warnings", album: "Signal Fires" },
  { title: "Storms Never Last Anyway", artist: "Meadowlark Motel", album: "Vacancy" },
  { title: "Sara, Put the Phone Down", artist: "The Attic Choir", album: "Third Floor" },
  { title: "Tusk of the Matter", artist: "Bramble Hill", album: "Thorn & Thread" },
  { title: "Beautiful Child, Terrible Man", artist: "Luna Vell", album: "Retrograde Everything" },
  { title: "Second Hand News to Me", artist: "Clementine Ash", album: "Late Checkout" },
  { title: "That's Alright, I Guess", artist: "Opal Reyes", album: "Fortune Teller's Day Off" },
  { title: "Never Going Back (Except Tuesday)", artist: "The Foxglove Sisters", album: "Garden Party" },
  { title: "Songbird on Read", artist: "Rosemary Quinn", album: "Kitchen Table Tarot" },
  { title: "Oh Daddy Issues", artist: "Petra & the Warnings", album: "Signal Fires" },
  { title: "What Makes You Think You're the One", artist: "The Velvet Omens", album: "Candle Season" },
  { title: "Hold Me (But Like, Emotionally)", artist: "Dust & Daisy", album: "Pressed Flowers" },
  { title: "Paper Doll Boyfriend", artist: "Clementine Ash", album: "Late Checkout" },
  { title: "Moonlight Standard Time", artist: "Luna Vell", album: "Retrograde Everything" },
  { title: "The Ghost of Date Three", artist: "The Attic Choir", album: "Third Floor" },
  { title: "Ivy on the Fire Escape", artist: "Bramble Hill", album: "Thorn & Thread" },
  { title: "Candle Wax Confessions", artist: "Opal Reyes", album: "Fortune Teller's Day Off" },
  { title: "Static on His Side of the Bed", artist: "Meadowlark Motel", album: "Vacancy" },
];

export function searchMockSongs(query: string): Song[] {
  const q = query.trim().toLowerCase();
  if (!q) return MOCK_SONGS.slice(0, 8);
  return MOCK_SONGS.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      (s.album ?? "").toLowerCase().includes(q)
  ).slice(0, 12);
}
