"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Song } from "@/lib/types";
import { Vinyl } from "./Vinyl";

/**
 * Global "now playing" state.
 * Plays the 30s preview when a previewUrl exists; otherwise it's a visual
 * spin-the-vinyl experience with an "Open in Spotify" escape hatch.
 */
interface PlayerState {
  song: Song | null;
  playing: boolean;
  play: (song: Song) => void;
  stop: () => void;
}

const PlayerContext = createContext<PlayerState>({
  song: null,
  playing: false,
  play: () => {},
  stop: () => {},
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

  const play = useCallback(
    (s: Song) => {
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
    },
    []
  );

  useEffect(() => () => audioRef.current?.pause(), []);

  return (
    <PlayerContext.Provider value={{ song, playing, play, stop }}>
      {children}
      <NowPlayingBar />
    </PlayerContext.Provider>
  );
}

function NowPlayingBar() {
  const { song, playing, stop, play } = usePlayer();
  if (!song) return null;
  return (
    <div className="fixed bottom-20 right-3 md:bottom-4 md:right-4 z-40">
      <div className="paper rounded-md px-3 py-2 flex items-center gap-3 max-w-[19rem] border border-ink/20">
        <Vinyl size={40} spinning={playing} />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm text-ink truncate">{song.title}</p>
          <p className="text-xs text-ink-soft italic truncate">{song.artist}</p>
          {!song.previewUrl && playing && (
            <p className="font-hand text-xs text-espresso/80">no preview — vibe along</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <button
            onClick={() => (playing ? stop() : play(song))}
            className="text-xs font-heading tracking-wide text-espresso hover:text-burgundy"
            aria-label={playing ? "Stop" : "Play"}
          >
            {playing ? "◼ stop" : "▶ play"}
          </button>
          {song.externalUrl && (
            <a
              href={song.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] underline text-ink-soft hover:text-burgundy"
            >
              Open in Spotify
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
