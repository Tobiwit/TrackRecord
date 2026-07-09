import type { Song } from "./types";
import { searchMockSongs } from "./songs";

/**
 * Song search abstraction.
 * If NEXT_PUBLIC_SPOTIFY_CLIENT_ID is configured, searches go through the
 * /api/spotify/search route (client-credentials flow). Otherwise the mock
 * catalog is used so the app never blocks on Spotify being unconfigured.
 */
export function spotifyConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID);
}

export async function searchSongs(query: string): Promise<Song[]> {
  if (spotifyConfigured()) {
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = (await res.json()) as { songs: Song[] };
        return data.songs;
      }
    } catch {
      // fall through to mock data
    }
  }
  // Simulate a little network latency so the UI feels honest in dev
  await new Promise((r) => setTimeout(r, 180));
  return searchMockSongs(query);
}
