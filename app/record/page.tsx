"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { RecordVinyl } from "@/components/RecordVinyl";
import { EmptyLinerNotes, LinerNotes } from "@/components/LinerNotes";
import { PersonAvatar } from "@/components/Avatar";
import { usePlayer } from "@/components/Player";
import { peopleOf, postsOf, useStore } from "@/lib/db";
import { accent } from "@/lib/colors";
import {
  MAX_STORYLINES,
  buildStorylines,
  buildTracks,
  isPlayable,
  sameSong,
  selectStorylines,
} from "@/lib/record";

export default function RecordPage() {
  return (
    <Shell>
      <RecordInner />
    </Shell>
  );
}

/**
 * Eight rings on a phone-width record leaves ~11px per groove, which is not a
 * tap target. Below the small breakpoint the record carries six instead — the
 * rest stay one link away, same as they are for everyone else.
 */
const NARROW = "(max-width: 639px)";

function useNarrowRecord(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(NARROW);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(NARROW).matches,
    () => false
  );
}

function RecordInner() {
  const { db, currentUser } = useStore();
  const { song, playing, play, stop, resume } = usePlayer();

  // one clock for the whole render — ongoing arcs shouldn't twitch on re-render
  const [now] = useState(() => Date.now());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const limit = useNarrowRecord() ? 6 : MAX_STORYLINES;

  const { storylines, tracks, hiddenCount } = useMemo(() => {
    if (!currentUser) return { storylines: [], tracks: [], hiddenCount: 0 };
    const all = buildStorylines(peopleOf(db, currentUser.id), postsOf(db, currentUser.id), now);
    const shown = selectStorylines(all, limit);
    return {
      storylines: shown,
      tracks: buildTracks(shown, now),
      hiddenCount: all.length - shown.length,
    };
  }, [db, currentUser, now, limit]);

  // the newest storyline is selected on arrival — quietly, without playing
  useEffect(() => {
    if (storylines.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) =>
      current && storylines.some((s) => s.person.id === current) ? current : storylines[0].person.id
    );
  }, [storylines]);

  const selected = storylines.find((s) => s.person.id === selectedId) ?? null;
  const previewed = storylines.find((s) => s.person.id === previewId) ?? null;
  // hovering only previews; the selection is what actually plays
  const shown = previewed ?? selected;
  const selectedSong = selected?.latestSong ?? null;
  const isSelectedPlaying = playing && sameSong(song, selectedSong);

  const select = useCallback(
    (personId: string) => {
      const target = storylines.find((s) => s.person.id === personId);
      if (!target) return;
      const already = personId === selectedId;
      setSelectedId(personId);

      const next = target.latestSong;
      if (!next) return;
      if (already && playing && sameSong(song, next)) stop();
      else if (sameSong(song, next)) resume();
      else play(next);
    },
    [storylines, selectedId, playing, song, play, stop, resume]
  );

  const togglePlay = useCallback(() => {
    if (!selectedSong) return;
    if (playing && sameSong(song, selectedSong)) stop();
    else if (sameSong(song, selectedSong)) resume();
    else play(selectedSong);
  }, [selectedSong, playing, song, play, stop, resume]);

  if (!currentUser) return null;

  const empty = storylines.length === 0;
  const shownSong = shown?.latestSong ?? null;

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-6 pb-40 lg:pb-44 max-w-[1600px] mx-auto">
      {/* ---- header ---- */}
      <div className="flex items-end justify-between flex-wrap gap-x-6 gap-y-2">
        <div>
          <h1 className="font-title text-3xl md:text-4xl text-ink leading-none">The Record</h1>
          <p className="font-hand text-2xl text-sepia rotate-[-1.5deg] origin-left mt-1">
            every era, pressed onto one disc
          </p>
        </div>
        <div className="flex items-baseline gap-4 ml-auto">
          <p className="hidden lg:block font-type text-[11px] text-sepia tracking-wide">
            hover a groove · click to drop the needle
          </p>
          {hiddenCount > 0 && (
            <Link href="/people" className="text-sm underline text-espresso hover:text-burgundy">
              {hiddenCount} older {hiddenCount === 1 ? "story" : "stories"} on the shelf →
            </Link>
          )}
        </div>
      </div>

      {/* ---- the record + the sleeve insert ---- */}
      <div className="mt-4 md:mt-5 grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,29%)] lg:items-center">
        <div className="justify-self-center w-full" style={{ maxWidth: "min(100%, 76vh)" }}>
          <RecordVinyl
            tracks={tracks}
            selectedId={selectedId}
            previewId={previewId}
            spinning={isSelectedPlaying}
            playing={isSelectedPlaying}
            song={shownSong}
            artworkUrl={shownSong?.albumArtUrl}
            labelTitle={
              shown ? shown.person.eraTitle?.trim() || `The ${shown.person.name} Era` : "Track Record"
            }
            emptyNote={empty ? "Nothing pressed yet" : undefined}
            onPreview={setPreviewId}
            onSelect={select}
            onTogglePlay={togglePlay}
          />

          {/* touch-friendly selection — the grooves are thin on a phone */}
          {!empty && (
            <div className="lg:hidden mt-4">
              <p className="font-hand text-lg text-sepia leading-none rotate-[-1deg] origin-left">
                tap a groove, or pick from the cast:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {storylines.map((s) => {
                  const on = s.person.id === selectedId;
                  return (
                    <button
                      key={s.person.id}
                      onClick={() => select(s.person.id)}
                      aria-pressed={on}
                      className={`flex items-center gap-2 rounded-sm border px-2.5 py-2 min-h-11 transition-colors ${
                        on ? "bg-ink/10 border-ink/45" : "border-ink/20 hover:border-ink/40"
                      }`}
                      style={on ? { borderColor: `${accent(s.person.color).hex}` } : undefined}
                    >
                      <PersonAvatar person={s.person} size={24} />
                      <span className={`font-heading text-sm ${on ? "text-ink" : "text-ink-soft"}`}>
                        {s.person.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {shown ? (
          <LinerNotes
            storyline={shown}
            playing={isSelectedPlaying && shown.person.id === selectedId}
          />
        ) : (
          <EmptyLinerNotes />
        )}
      </div>

      {empty && (
        <p className="font-hand text-xl text-sepia text-center mt-6 lg:mt-2">
          the grooves are waiting ↑
        </p>
      )}

      {!empty && shownSong && !isPlayable(shownSong) && (
        <p className="sr-only" aria-live="polite">
          No audio preview available for {shownSong.title}.
        </p>
      )}
    </div>
  );
}
