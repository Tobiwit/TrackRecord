"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Song } from "@/lib/types";
import { Vinyl } from "./Vinyl";

/**
 * Global "now playing" state.
 *
 * Three tiers of actual audio, best available wins:
 * 1. previewUrl (mock catalog or legacy Spotify apps) — plays directly.
 * 2. spotifyId — renders Spotify's embed player (30s preview for everyone,
 *    full track when the browser is logged into Spotify). Requires a click
 *    inside the embed; autoplay is not allowed by Spotify.
 * 3. neither — the vinyl spins and the vibe is implied.
 */
interface PlayerState {
  song: Song | null;
  playing: boolean;
  play: (song: Song) => void;
  stop: () => void;
  clear: () => void;
}

const PlayerContext = createContext<PlayerState>({
  song: null,
  playing: false,
  play: () => {},
  stop: () => {},
  clear: () => {},
});

export function usePlayer() {
  return useContext(PlayerContext);
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [song, setSong] = useState<Song | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(false);
  }, []);

  const clear = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(false);
    setSong(null);
  }, []);

  const play = useCallback((s: Song) => {
    audioRef.current?.pause();
    audioRef.current = null;
    setSong(s);
    setPlaying(true);
    if (s.previewUrl) {
      const audio = new Audio(s.previewUrl);
      audio.volume = 0.8;
      audio.onended = () => setPlaying(false);
      audio.play().catch(() => {
        /* autoplay blocked — the vinyl still spins */
      });
      audioRef.current = audio;
    }
  }, []);

  useEffect(() => () => audioRef.current?.pause(), []);

  return (
    <PlayerContext.Provider value={{ song, playing, play, stop, clear }}>
      {children}
      <NowPlayingBar />
    </PlayerContext.Provider>
  );
}

/** Spotify's embedded player for one track. Height 80 = compact variant. */
export function SpotifyEmbed({ spotifyId, height = 80 }: { spotifyId: string; height?: number }) {
  return (
    <iframe
      src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
      width="100%"
      height={height}
      frameBorder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      title="Spotify player"
      style={{ borderRadius: "8px", display: "block" }}
    />
  );
}

function NowPlayingBar() {
  const { song, playing, stop, play, clear } = usePlayer();
  if (!song) return null;
  const embed = Boolean(song.spotifyId && !song.previewUrl);
  return (
    <div className="fixed bottom-20 right-3 md:bottom-4 md:right-4 z-40 w-[19rem] max-w-[calc(100vw-1.5rem)]">
      <div className="paper rounded-md p-2.5">
        <div className="flex items-center gap-3">
          <Vinyl size={36} spinning={playing} />
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm text-ink truncate">{song.title}</p>
            <p className="text-xs text-ink-soft italic truncate">{song.artist}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              onClick={clear}
              className="font-heading text-lg leading-none text-ink-soft hover:text-burgundy"
              aria-label="Dismiss player"
            >
              ×
            </button>
            {!embed && (
              <button
                onClick={() => (playing ? stop() : play(song))}
                className="text-xs font-heading tracking-wide text-espresso hover:text-burgundy"
                aria-label={playing ? "Stop" : "Play"}
              >
                {playing ? "◼ stop" : "▶ play"}
              </button>
            )}
          </div>
        </div>
        {embed ? (
          <div className="mt-2">
            <SpotifyEmbed spotifyId={song.spotifyId!} />
          </div>
        ) : (
          !song.previewUrl &&
          playing && (
            <p className="font-hand text-base text-sepia leading-none mt-1.5 text-right rotate-[-1deg]">
              no preview — vibe along
            </p>
          )
        )}
        {song.externalUrl && !embed && (
          <a
            href={song.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="block text-right text-[11px] underline text-ink-soft hover:text-burgundy mt-1"
          >
            Open in Spotify
          </a>
        )}
      </div>
    </div>
  );
}
