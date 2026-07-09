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
    pauseActiveEmbed();
    setPlaying(false);
  }, []);

  const clear = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    pauseActiveEmbed();
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

/* ---- Spotify iFrame Embed API ----
   Loaded once; lets us start playback programmatically. Browsers only allow
   audio after a user gesture on the page (clicking a card counts; hovering
   does not) — when blocked, the embed still renders with its play button. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let iframeApiPromise: Promise<any> | null = null;

/** The now-playing bar's embed controller, so stop()/clear() can pause it. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let activeEmbedController: any = null;

function pauseActiveEmbed() {
  try {
    activeEmbedController?.pause();
  } catch {
    /* iframe already gone */
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getIframeAPI(): Promise<any> {
  if (!iframeApiPromise) {
    iframeApiPromise = new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).onSpotifyIframeApiReady = (api: any) => resolve(api);
      const script = document.createElement("script");
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      document.body.appendChild(script);
    });
  }
  return iframeApiPromise;
}

/** Spotify's embedded player for one track. Height 80 = compact variant. */
export function SpotifyEmbed({
  spotifyId,
  height = 80,
  autoplay = false,
  isNowPlayingBar = false,
}: {
  spotifyId: string;
  height?: number;
  autoplay?: boolean;
  /** registers this embed so the global stop()/clear() can pause it */
  isNowPlayingBar?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let controller: any = null;

    // the API replaces the element we hand it, so give it a disposable child
    const mount = document.createElement("div");
    container.appendChild(mount);

    getIframeAPI().then((api) => {
      if (cancelled) return;
      api.createController(
        mount,
        { uri: `spotify:track:${spotifyId}`, width: "100%", height },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) => {
          controller = c;
          if (isNowPlayingBar) activeEmbedController = c;
          if (autoplay) {
            c.addListener("ready", () => {
              if (!cancelled) c.play();
            });
          }
        }
      );
    });

    return () => {
      cancelled = true;
      if (isNowPlayingBar && activeEmbedController === controller) {
        activeEmbedController = null;
      }
      try {
        controller?.destroy();
      } catch {
        /* iframe already gone */
      }
      container.innerHTML = "";
    };
  }, [spotifyId, height, autoplay, isNowPlayingBar]);

  return <div ref={containerRef} style={{ minHeight: height }} />;
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
            <SpotifyEmbed spotifyId={song.spotifyId!} autoplay isNowPlayingBar />
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
