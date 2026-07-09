"use client";

import { useEffect, useRef, useState } from "react";
import type { Song } from "@/lib/types";
import { searchSongs, spotifyConfigured } from "@/lib/spotify";
import { Vinyl } from "./Vinyl";
import { usePlayer } from "./Player";

/** Search-and-select a song. No song, no lore. */
export function SongPicker({
  selected,
  onSelect,
}: {
  selected: Song | null;
  onSelect: (song: Song | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const { play, stop, song, playing } = usePlayer();
  const seq = useRef(0);

  useEffect(() => {
    const id = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      const songs = await searchSongs(query);
      if (seq.current === id) {
        setResults(songs);
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  if (selected) {
    const isPlaying = song === selected && playing;
    return (
      <div className="paper-deep rounded-sm p-3 flex items-center gap-3 border border-gold/50">
        {selected.albumArtUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selected.albumArtUrl} alt="" className="w-12 h-12 rounded-sm object-cover border border-ink/20" />
        ) : (
          <Vinyl size={48} spinning={isPlaying} />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-hand text-espresso/70 leading-none">track added ♪</p>
          <p className="font-heading text-ink truncate">{selected.title}</p>
          <p className="text-sm text-ink-soft italic truncate">{selected.artist}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <button
            type="button"
            onClick={() => (isPlaying ? stop() : play(selected))}
            className="text-sm font-heading text-espresso hover:text-burgundy"
          >
            {isPlaying ? "◼ stop" : "▶ preview"}
          </button>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs underline text-ink-soft hover:text-burgundy"
          >
            change song
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="pick the soundtrack… search songs"
        className="vintage w-full rounded-sm px-3 py-2"
        autoFocus
      />
      {!spotifyConfigured() && (
        <p className="font-hand text-sm text-espresso/70 mt-1">
          Spotify isn&apos;t connected — searching the house catalog instead.
        </p>
      )}
      <div className="mt-2 max-h-64 overflow-y-auto scroll-thin space-y-1">
        {loading && <p className="text-sm text-ink-soft italic px-1">flipping through the crates…</p>}
        {!loading && results.length === 0 && (
          <p className="text-sm text-ink-soft italic px-1">Nothing in the crates. Try another search — this update needs a song.</p>
        )}
        {results.map((s, i) => {
          const isPlaying = song === s && playing;
          return (
            <div
              key={`${s.title}-${s.artist}-${i}`}
              className="flex items-center gap-2.5 rounded-sm px-2 py-1.5 hover:bg-espresso/10"
            >
              {s.albumArtUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.albumArtUrl} alt="" className="w-9 h-9 rounded-sm object-cover border border-ink/20" />
              ) : (
                <Vinyl size={34} spinning={isPlaying} />
              )}
              <button
                type="button"
                onClick={() => {
                  stop();
                  onSelect(s);
                }}
                className="min-w-0 flex-1 text-left"
              >
                <p className="font-heading text-sm text-ink truncate">{s.title}</p>
                <p className="text-xs text-ink-soft italic truncate">
                  {s.artist}
                  {s.album ? ` — ${s.album}` : ""}
                </p>
              </button>
              <button
                type="button"
                onClick={() => (isPlaying ? stop() : play(s))}
                className="text-xs font-heading text-espresso hover:text-burgundy shrink-0"
              >
                {isPlaying ? "◼" : "▶"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
