import { NextRequest, NextResponse } from "next/server";
import type { Song } from "@/lib/types";

/**
 * Spotify search proxy using the client-credentials flow.
 * Requires NEXT_PUBLIC_SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.
 * Returns 503 when unconfigured; the client falls back to mock data.
 */
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string | null> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 10_000) {
    return cachedToken.token;
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) return null;
  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: "Spotify not configured" }, { status: 503 });
  }

  const res = await fetch(
    `https://api.spotify.com/v1/search?type=track&limit=12&q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    return NextResponse.json({ error: "Spotify search failed" }, { status: 502 });
  }
  const data = await res.json();

  const songs: Song[] = (data.tracks?.items ?? []).map((t: any) => ({
    spotifyId: t.id,
    title: t.name,
    artist: t.artists?.map((a: any) => a.name).join(", ") ?? "Unknown",
    album: t.album?.name,
    albumArtUrl: t.album?.images?.[1]?.url ?? t.album?.images?.[0]?.url,
    previewUrl: t.preview_url ?? undefined,
    externalUrl: t.external_urls?.spotify,
  }));

  return NextResponse.json({ songs });
}
