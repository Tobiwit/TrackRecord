"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { PersonAvatar } from "@/components/Avatar";
import { MoodIcon } from "@/components/MoodIcon";
import { SongPicker } from "@/components/SongPicker";
import { createPost, peopleOf, useStore } from "@/lib/db";
import { STANDARD_EVENTS } from "@/lib/events";
import { MOODS } from "@/lib/moods";
import { accent } from "@/lib/colors";
import type { Song } from "@/lib/types";

export default function NewPostPage() {
  return (
    <Shell>
      <NewPostInner />
    </Shell>
  );
}

const STEPS = ["who", "what kind", "the song", "the words", "the mood", "publish"] as const;

function NewPostInner() {
  const { db, currentUser } = useStore();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [personIds, setPersonIds] = useState<string[]>([]);
  const [postType, setPostType] = useState<"update" | "standard_event" | null>(null);
  const [eventType, setEventType] = useState<string | null>(null);
  const [song, setSong] = useState<Song | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [dateOverride, setDateOverride] = useState("");
  const [moodIcon, setMoodIcon] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser) return null;
  const people = peopleOf(db, currentUser.id);
  const activePeople = people.filter((p) => p.active);

  if (people.length === 0) {
    return (
      <div className="p-8 flex justify-center">
        <div className="paper rounded-sm max-w-sm w-full p-8 text-center mt-12" style={{ transform: "rotate(-0.5deg)" }}>
          <p className="font-heading text-xl text-ink">Who would this even be about?</p>
          <p className="font-hand text-lg text-espresso/80 mt-2">
            The lore needs a cast before it gets a plot.
          </p>
          <Link href="/people" className="btn-vintage inline-block rounded-sm px-4 py-2 mt-4">
            Add someone to the lore
          </Link>
        </div>
      </div>
    );
  }

  const chosenEvent = STANDARD_EVENTS.find((e) => e.key === eventType);

  function next() {
    setError(null);
    // validate current step
    if (step === 0 && personIds.length === 0) return setError("Pick at least one. It's about someone.");
    if (step === 1 && !postType) return setError("Diary page or stamp — choose one.");
    if (step === 1 && postType === "standard_event" && !eventType) return setError("Pick the event.");
    if (step === 2 && !song) return setError("No song, no lore.");
    if (step === 3 && postType === "update" && !title.trim()) return setError("Give it a headline.");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function publish() {
    if (!moodIcon) return setError("Every entry gets a mood.");
    if (!song || !postType || !currentUser) return;
    createPost({
      ownerUserId: currentUser.id,
      personIds,
      type: postType,
      eventType: postType === "standard_event" ? (eventType ?? undefined) : undefined,
      title: postType === "standard_event" ? (chosenEvent?.label ?? "Event") : title.trim(),
      text: text.trim() || undefined,
      moodIcon,
      song,
      dateOverride: dateOverride ? new Date(dateOverride).getTime() : undefined,
    });
    router.push("/me");
  }

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto">
      <h2 className="font-heading text-2xl md:text-3xl text-cream">New Track</h2>
      <p className="font-hand text-gold/80 text-lg">this one deserves a bridge</p>

      {/* step dots */}
      <div className="flex items-center gap-1.5 mt-4">
        {STEPS.map((label, i) => (
          <button
            key={label}
            onClick={() => i < step && setStep(i)}
            className={`h-2 rounded-full transition-all ${
              i === step ? "w-8 bg-gold" : i < step ? "w-4 bg-gold/50" : "w-4 bg-cream/15"
            }`}
            aria-label={`step ${i + 1}: ${label}`}
            disabled={i > step}
          />
        ))}
        <span className="font-hand text-gold/70 text-base ml-2">{STEPS[step]}</span>
      </div>

      <div className="paper rounded-sm p-5 md:p-6 mt-4 relative" style={{ transform: "rotate(0.3deg)" }}>
        <span className="tape -top-2.5 right-10 rotate-[3deg]" aria-hidden />

        {/* STEP 0: person */}
        {step === 0 && (
          <div>
            <h3 className="font-heading text-xl text-ink">Who is this about?</h3>
            <p className="text-sm text-ink-soft italic mt-0.5">Pick one — or two, we don&apos;t judge here.</p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {activePeople.map((p) => {
                const chosen = personIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() =>
                      setPersonIds((ids) =>
                        chosen ? ids.filter((x) => x !== p.id) : [...ids, p.id].slice(-2)
                      )
                    }
                    className={`flex items-center gap-2.5 rounded-sm border p-2.5 text-left transition-colors ${
                      chosen ? "border-ink bg-espresso/10" : "border-ink/20 hover:border-ink/50"
                    }`}
                  >
                    <PersonAvatar person={p} size={36} />
                    <span className="min-w-0">
                      <span className="font-heading text-ink block truncate">{p.name}</span>
                      {p.nickname && <span className="font-hand text-espresso/70 text-sm block truncate">“{p.nickname}”</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-ink-soft mt-3">
              Someone missing? <Link href="/people" className="underline">Add a new one</Link>.
            </p>
          </div>
        )}

        {/* STEP 1: type */}
        {step === 1 && (
          <div>
            <h3 className="font-heading text-xl text-ink">What kind of entry?</h3>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => {
                  setPostType("update");
                  setEventType(null);
                }}
                className={`rounded-sm border p-4 text-left ${
                  postType === "update" ? "border-ink bg-espresso/10" : "border-ink/20 hover:border-ink/50"
                }`}
              >
                <p className="font-heading text-ink">Diary page</p>
                <p className="text-xs text-ink-soft italic mt-1">freeform lore, in your own words</p>
              </button>
              <button
                onClick={() => setPostType("standard_event")}
                className={`rounded-sm border p-4 text-left ${
                  postType === "standard_event" ? "border-ink bg-espresso/10" : "border-ink/20 hover:border-ink/50"
                }`}
              >
                <p className="font-heading text-ink">Event stamp</p>
                <p className="text-xs text-ink-soft italic mt-1">the classics — first kiss, red flag…</p>
              </button>
            </div>

            {postType === "standard_event" && (
              <div className="flex flex-wrap gap-2 mt-4">
                {STANDARD_EVENTS.map((e) => (
                  <button
                    key={e.key}
                    onClick={() => {
                      setEventType(e.key);
                      setMoodIcon(e.moodIcon);
                    }}
                    className={`flex items-center gap-1.5 rounded-sm border-2 border-dashed px-2.5 py-1.5 text-sm uppercase tracking-wider transition-transform hover:-rotate-1 ${
                      eventType === e.key
                        ? "border-burgundy text-burgundy bg-burgundy/10 -rotate-1"
                        : "border-ink/30 text-ink-soft"
                    }`}
                    style={{ fontSize: "11px" }}
                  >
                    <MoodIcon moodKey={e.moodIcon} className="w-3.5 h-3.5" />
                    {e.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: song */}
        {step === 2 && (
          <div>
            <h3 className="font-heading text-xl text-ink">Pick the soundtrack</h3>
            <p className="font-hand text-espresso/80 mt-0.5">no song, no lore</p>
            <div className="mt-3">
              <SongPicker selected={song} onSelect={setSong} />
            </div>
          </div>
        )}

        {/* STEP 3: words */}
        {step === 3 && (
          <div>
            <h3 className="font-heading text-xl text-ink">
              {postType === "standard_event" ? chosenEvent?.label : "The words"}
            </h3>
            {postType === "update" && (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="headline — e.g. 'He resurfaced.'"
                className="vintage w-full rounded-sm px-3 py-2 mt-3"
              />
            )}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={postType === "standard_event" ? "add details if the stamp isn't enough (optional)…" : "tell it like the group chat deserves…"}
              rows={5}
              className="vintage w-full rounded-sm px-3 py-2 mt-3"
            />
            <label className="flex items-center gap-2 mt-3 text-sm text-ink-soft">
              <span className="font-hand text-base text-espresso/80">when did this happen?</span>
              <input
                type="date"
                value={dateOverride}
                onChange={(e) => setDateOverride(e.target.value)}
                className="vintage rounded-sm px-2 py-1"
              />
              <span className="text-xs italic">(blank = today)</span>
            </label>
          </div>
        )}

        {/* STEP 4: mood */}
        {step === 4 && (
          <div>
            <h3 className="font-heading text-xl text-ink">And the mood?</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
              {MOODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMoodIcon(m.key)}
                  className={`flex flex-col items-center gap-1 rounded-sm border p-3 ${
                    moodIcon === m.key ? "border-ink bg-espresso/10" : "border-ink/20 hover:border-ink/50"
                  }`}
                >
                  <span className="text-espresso">
                    <MoodIcon moodKey={m.key} className="w-6 h-6" />
                  </span>
                  <span className="font-hand text-espresso/90 text-sm">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: publish */}
        {step === 5 && (
          <div>
            <h3 className="font-heading text-xl text-ink">Read it back</h3>
            <div className="paper-deep rounded-sm p-4 mt-3 border border-ink/15">
              <p className="font-hand text-espresso/80 text-sm">
                about {personIds.map((id) => people.find((p) => p.id === id)?.name).filter(Boolean).join(" & ")}
              </p>
              <p className="font-heading text-lg text-ink mt-1">
                {postType === "standard_event" ? chosenEvent?.label : title}
              </p>
              {text && <p className="text-sm text-ink-soft italic mt-1 line-clamp-3">{text}</p>}
              <p className="text-sm text-ink mt-2 flex items-center gap-1.5">
                {moodIcon && (
                  <span className="text-espresso">
                    <MoodIcon moodKey={moodIcon} className="w-4 h-4" />
                  </span>
                )}
                ♪ {song?.title} — <span className="italic">{song?.artist}</span>
              </p>
            </div>
            <p className="font-hand text-espresso/80 text-lg mt-3 text-center">
              your friends are waiting for the tea
            </p>
          </div>
        )}

        {error && <p className="text-sm text-burgundy italic mt-3">{error}</p>}

        {/* nav */}
        <div className="flex items-center justify-between mt-5 pt-3 border-t border-dashed ink-line">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={`text-sm underline text-ink-soft hover:text-espresso ${step === 0 ? "invisible" : ""}`}
          >
            ← back
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="btn-vintage rounded-sm px-5 py-2">
              Next →
            </button>
          ) : (
            <button onClick={publish} className="btn-vintage rounded-sm px-5 py-2">
              ♪ Add to the record
            </button>
          )}
        </div>
      </div>

      {/* accent hint for chosen people */}
      {personIds.length > 0 && (
        <p className="text-xs text-cream/50 mt-3 text-center">
          {personIds
            .map((id) => {
              const p = people.find((x) => x.id === id);
              return p ? `${p.name} files under ${accent(p.color).label.toLowerCase()}` : null;
            })
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}
