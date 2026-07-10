"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { PersonAvatar } from "@/components/Avatar";
import { createPerson, deletePerson, peopleOf, postsOf, updatePerson, useStore } from "@/lib/db";
import { ACCENT_COLORS, accent } from "@/lib/colors";
import { formatDate } from "@/lib/format";

export default function PeoplePage() {
  return (
    <Shell>
      <PeopleInner />
    </Shell>
  );
}

function PeopleInner() {
  const { db, currentUser } = useStore();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  if (!currentUser) return null;
  const people = peopleOf(db, currentUser.id);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-title text-3xl md:text-4xl text-ink">The Cast</h2>
          <p className="font-hand text-2xl text-sepia rotate-[-1.5deg] origin-left">everyone the songs are about</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-vintage rounded-sm px-4 py-2">
          {showForm ? "never mind" : "+ Add someone to the lore"}
        </button>
      </div>

      {showForm && (
        <PersonForm
          onDone={() => setShowForm(false)}
          usedColors={people.map((p) => p.color)}
          ownerUserId={currentUser.id}
        />
      )}

      <div className="mt-6 space-y-3">
        {people.length === 0 && !showForm && (
          <div className="paper rounded-sm max-w-sm mx-auto mt-10 p-8 text-center" style={{ transform: "rotate(0.5deg)" }}>
            <p className="font-heading text-xl text-ink">Nobody in the cast yet.</p>
            <p className="font-hand text-xl text-sepia mt-2">
              The stage is empty. Suspiciously peaceful.
            </p>
          </div>
        )}
        {people.map((p) => {
          const count = postsOf(db, currentUser.id).filter((po) => po.personIds.includes(p.id)).length;
          return (
            <div key={p.id} className="paper rounded-sm p-4 flex items-center gap-4 relative" style={{ transform: "rotate(-0.2deg)" }}>
              <PersonAvatar person={p} size={52} />
              <div className="min-w-0 flex-1">
                <p className="font-heading text-lg text-ink">
                  {p.name}
                  {p.nickname && <span className="font-hand text-lg text-sepia ml-2">“{p.nickname}”</span>}
                  {!p.active && (
                    <span className="ml-2 text-[10px] uppercase tracking-widest text-moongrey border border-moongrey/50 rounded-sm px-1 py-px">
                      archived
                    </span>
                  )}
                </p>
                <p className="text-sm text-ink-soft italic">
                  {[
                    p.age ? `${p.age}` : null,
                    p.city ? `lives ${p.city}` : null,
                    p.metWhere ? `met at ${p.metWhere}` : null,
                    p.firstDate ? `first date ${formatDate(p.firstDate)}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "a mystery, honestly"}
                </p>
                <p className="text-xs text-ink-soft mt-0.5">
                  <span className="inline-block w-2 h-2 rounded-full mr-1 align-middle" style={{ background: accent(p.color).hex }} />
                  {accent(p.color).label} · {count} {count === 1 ? "entry" : "entries"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0 text-xs">
                {p.active ? (
                  <button
                    onClick={() => updatePerson(p.id, { active: false })}
                    className="underline text-ink-soft hover:text-espresso"
                  >
                    archive era
                  </button>
                ) : (
                  <>
                    {p.eraTitle ? (
                      <Link href={`/era/${p.id}`} className="underline text-espresso hover:text-burgundy">
                        view the record ♪
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          const title = window.prompt(
                            "Name this era before it goes on the shelf:",
                            `The ${p.name} Era`
                          );
                          if (title === null) return;
                          updatePerson(p.id, { eraTitle: title.trim() || `The ${p.name} Era` });
                          router.push(`/era/${p.id}`);
                        }}
                        className="underline text-espresso hover:text-burgundy"
                      >
                        press the record ♪
                      </button>
                    )}
                    <button
                      onClick={() => updatePerson(p.id, { active: true })}
                      className="underline text-ink-soft hover:text-espresso"
                    >
                      revive era
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    if (window.confirm(`Remove ${p.name} and their solo entries from the record?`)) {
                      deletePerson(p.id);
                    }
                  }}
                  className="underline text-burgundy/80 hover:text-burgundy"
                >
                  remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PersonForm({
  onDone,
  usedColors,
  ownerUserId,
}: {
  onDone: () => void;
  usedColors: string[];
  ownerUserId: string;
}) {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [metWhere, setMetWhere] = useState("");
  const [firstDate, setFirstDate] = useState("");
  const [color, setColor] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Who is this about? A name is required.");
      return;
    }
    createPerson({
      ownerUserId,
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      age: age ? Number(age) : undefined,
      city: city.trim() || undefined,
      metWhere: metWhere.trim() || undefined,
      firstDate: firstDate ? new Date(firstDate).getTime() : undefined,
      color: color || undefined,
    });
    onDone();
  }

  return (
    <form onSubmit={submit} className="paper rounded-sm p-5 mt-5 relative" style={{ transform: "rotate(0.3deg)" }}>
      <span className="tape -top-2.5 left-8 rotate-[-4deg]" aria-hidden />
      <h3 className="font-heading text-xl text-ink">Who is this about?</h3>

      <div className="grid md:grid-cols-2 gap-3 mt-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="name (required)" className="vintage rounded-sm px-3 py-2" />
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="nickname — e.g. 'gallery guy'" className="vintage rounded-sm px-3 py-2" />
        <input value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} placeholder="age (optional)" inputMode="numeric" className="vintage rounded-sm px-3 py-2" />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="where he lives (optional)" className="vintage rounded-sm px-3 py-2" />
        <input value={metWhere} onChange={(e) => setMetWhere(e.target.value)} placeholder="where you met — app, bar, fate…" className="vintage rounded-sm px-3 py-2" />
        <label className="vintage rounded-sm px-3 py-2 text-sm text-ink-soft flex items-center gap-2">
          <span className="font-hand text-lg text-sepia shrink-0">first date:</span>
          <input type="date" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} className="bg-transparent flex-1 outline-none" />
        </label>
      </div>

      {/* color theme */}
      <p className="font-hand text-xl text-sepia mt-4">their color in the record</p>
      <div className="flex gap-2 mt-1 flex-wrap">
        {ACCENT_COLORS.map((c) => {
          const taken = usedColors.includes(c.key);
          return (
            <button
              key={c.key}
              type="button"
              title={taken ? `${c.label} (used by someone else in your cast)` : c.label}
              onClick={() => setColor(c.key)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                color === c.key ? "border-ink scale-110" : "border-ink/20"
              } ${taken ? "opacity-35" : "hover:scale-105"}`}
              style={{ background: c.hex }}
              disabled={taken}
            />
          );
        })}
      </div>

      <p className="text-xs text-ink-soft italic mt-4 border-l-2 pl-2 ink-line">
        Privacy first: no real photos, ever. Each person gets a consistent stylized vintage
        avatar drawn from their name and color.
      </p>

      {error && <p className="text-sm text-burgundy italic mt-2">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" className="btn-vintage rounded-sm px-4 py-2">
          Add to the cast
        </button>
        <button type="button" onClick={onDone} className="text-sm underline text-ink-soft hover:text-espresso">
          cancel
        </button>
      </div>
    </form>
  );
}
