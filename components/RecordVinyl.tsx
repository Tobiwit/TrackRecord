"use client";

import { useId, useMemo } from "react";
import type { Song } from "@/lib/types";
import { accent } from "@/lib/colors";
import {
  CENTER,
  R_DISC,
  R_LABEL,
  VIEW,
  arcLength,
  arcPath,
  arcPathReversed,
  arcRunsUnderside,
  grooveLabel,
  type VinylTrack,
} from "@/lib/record";

/**
 * The big record. One concentric ring per person: the innermost ring is the
 * newest storyline, older ones sit further out. Where a colored groove starts
 * around the ring says *when*, how far it runs says *how long*.
 *
 * Only the sheen and the centre label rotate during playback — a real record's
 * grooves look motionless anyway, and keeping them still means hover targets
 * and the chronological reading survive the spin.
 */
export function RecordVinyl({
  tracks,
  selectedId,
  previewId,
  spinning,
  song,
  artworkUrl,
  labelTitle,
  playing,
  onPreview,
  onSelect,
  onTogglePlay,
  emptyNote,
}: {
  tracks: VinylTrack[];
  selectedId: string | null;
  previewId: string | null;
  spinning: boolean;
  song: Song | null;
  artworkUrl?: string;
  /** Printed around the top of the paper label — the era name, or the person. */
  labelTitle: string;
  playing: boolean;
  onPreview: (personId: string | null) => void;
  onSelect: (personId: string) => void;
  onTogglePlay: () => void;
  emptyNote?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const grooves = useMemo(() => decorativeGrooves(), []);
  const focusId = previewId ?? selectedId;
  const labelColor = accent(
    tracks.find((t) => t.storyline.person.id === focusId)?.storyline.person.color ?? "gold"
  ).hex;

  return (
    <div className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="w-full h-full block overflow-visible"
        role="group"
        aria-label="Your dating history pressed onto a record. Each ring is one person; the innermost ring is the most recent."
      >
        <defs>
          <radialGradient id={`${uid}-disc`} cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#2b241c" />
            <stop offset="62%" stopColor="#1e1811" />
            <stop offset="100%" stopColor="#14100b" />
          </radialGradient>

          <linearGradient id={`${uid}-sheen`} x1="8%" y1="0%" x2="92%" y2="100%">
            <stop offset="0%" stopColor="#fff6e2" stopOpacity="0" />
            <stop offset="26%" stopColor="#fff6e2" stopOpacity="0.09" />
            <stop offset="45%" stopColor="#fff6e2" stopOpacity="0" />
            <stop offset="72%" stopColor="#fff6e2" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#fff6e2" stopOpacity="0" />
          </linearGradient>

          <radialGradient id={`${uid}-print`} cx="34%" cy="28%" r="78%">
            <stop offset="0%" stopColor="#fff8e8" stopOpacity="0.14" />
            <stop offset="58%" stopColor="#2e2015" stopOpacity="0" />
            <stop offset="100%" stopColor="#2e2015" stopOpacity="0.34" />
          </radialGradient>

          <clipPath id={`${uid}-label-clip`}>
            <circle cx={CENTER} cy={CENTER} r={R_LABEL} />
          </clipPath>

          {/* the era name curves across the top of the label, the way a
              record's imprint does — drawn clockwise so it reads upright */}
          <path
            id={`${uid}-label-arc`}
            fill="none"
            d={arcPath(CENTER, CENTER, R_LABEL - 30, -168, -12)}
          />
        </defs>

        {/* ---- the disc ---- */}
        <circle cx={CENTER} cy={CENTER} r={R_DISC} fill={`url(#${uid}-disc)`} />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={R_DISC - 2}
          fill="none"
          stroke="rgba(244,237,218,0.16)"
          strokeWidth="2.5"
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={R_DISC - 12}
          fill="none"
          stroke="rgba(20,16,11,0.9)"
          strokeWidth="3"
        />

        {/* decorative grooves — deliberately low contrast */}
        <g aria-hidden>
          {grooves.map((g) => (
            <circle
              key={g.r}
              cx={CENTER}
              cy={CENTER}
              r={g.r}
              fill="none"
              stroke="rgba(244,237,218,1)"
              strokeOpacity={g.opacity}
              strokeWidth={g.width}
            />
          ))}
          {/* lead-in and run-out bands */}
          <circle cx={CENTER} cy={CENTER} r={198} fill="none" stroke="rgba(12,9,6,0.85)" strokeWidth="5" />
          <circle cx={CENTER} cy={CENTER} r={466} fill="none" stroke="rgba(12,9,6,0.85)" strokeWidth="5" />
        </g>

        {/* ---- rotating light ---- */}
        <g
          className={`record-spin${spinning ? "" : " is-paused"}`}
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          aria-hidden
        >
          <circle cx={CENTER} cy={CENTER} r={R_DISC - 4} fill={`url(#${uid}-sheen)`} />
          {/* a long, faint gloss — light on lacquer, not a scratch */}
          <path
            d={arcPath(CENTER, CENTER, 398, -166, -112)}
            fill="none"
            stroke="rgba(255,246,226,0.11)"
            strokeWidth="34"
            strokeLinecap="round"
          />
          <path
            d={arcPath(CENTER, CENTER, 336, 28, 62)}
            fill="none"
            stroke="rgba(255,246,226,0.05)"
            strokeWidth="22"
            strokeLinecap="round"
          />
        </g>

        {/* ---- the storylines ---- */}
        <g>
          {tracks.map((track) => (
            <GrooveRing
              key={track.storyline.person.id}
              uid={uid}
              track={track}
              selected={selectedId === track.storyline.person.id}
              emphasized={focusId === track.storyline.person.id}
              dimmed={previewId !== null && previewId !== track.storyline.person.id}
              onPreview={onPreview}
              onSelect={onSelect}
            />
          ))}
        </g>

        {/* ---- centre ---- */}
        <g
          className={`record-spin${spinning ? "" : " is-paused"}`}
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
        >
          <CenterArtwork
            uid={uid}
            artworkUrl={artworkUrl}
            labelColor={labelColor}
            labelTitle={labelTitle}
            song={song}
            emptyNote={emptyNote}
          />
        </g>
      </svg>

      {/* ---- playback control, pinned to the spindle ---- */}
      {tracks.length > 0 && (
        <button
          type="button"
          onClick={onTogglePlay}
          className="record-spindle absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
          style={{ width: "13%", height: "13%" }}
          aria-label={
            song
              ? `${playing ? "Pause" : "Play"} ${song.title} by ${song.artist}`
              : "Play the selected track"
          }
        >
          <span aria-hidden className="text-[clamp(0.7rem,1.7vw,1.05rem)] leading-none">
            {playing ? "❚❚" : "▶"}
          </span>
        </button>
      )}
    </div>
  );
}

/* ---------- one person's ring ---------- */

function GrooveRing({
  uid,
  track,
  selected,
  emphasized,
  dimmed,
  onPreview,
  onSelect,
}: {
  uid: string;
  track: VinylTrack;
  selected: boolean;
  emphasized: boolean;
  dimmed: boolean;
  onPreview: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const { storyline, radius, arcs, pitch } = track;
  const person = storyline.person;
  const color = accent(person.color);

  const base = Math.min(pitch * 0.38, 16);
  const width = emphasized ? base + 3 : base;
  const hit = Math.max(26, pitch * 0.92);
  const labelOffset = Math.min(pitch * 0.5, 22) + 1;
  const labelSize = 18;
  const name = person.name;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={grooveLabel(storyline)}
      className="groove"
      data-emphasized={emphasized || undefined}
      data-dimmed={dimmed || undefined}
      onPointerEnter={(e) => e.pointerType === "mouse" && onPreview(person.id)}
      onPointerLeave={(e) => e.pointerType === "mouse" && onPreview(null)}
      onFocus={() => onPreview(person.id)}
      onBlur={() => onPreview(null)}
      onClick={() => onSelect(person.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(person.id);
        }
      }}
    >
      <title>{grooveLabel(storyline)}</title>

      {/* the whole ring, barely there — shows the groove this person owns */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={radius}
        fill="none"
        stroke={color.hex}
        strokeOpacity={emphasized ? 0.22 : 0.1}
        strokeWidth={base * 0.5}
        className="groove-ring"
      />

      {arcs.map((arc, i) => {
        const d = arcPath(CENTER, CENTER, radius, arc.start, arc.end);
        const labelPathId = `${uid}-lbl-${person.id}-${i}`;
        const fits =
          i === 0 && arcLength(radius, arc.span) > name.length * labelSize * 0.62 + 26;
        return (
          <g key={i}>
            {/* recessed channel, so the color sits *in* the record */}
            <path
              d={d}
              fill="none"
              stroke="rgba(10,8,5,0.72)"
              strokeWidth={width + 6}
              strokeLinecap="round"
            />
            <path
              d={d}
              fill="none"
              stroke={color.hex}
              strokeWidth={width}
              strokeLinecap="round"
              className="groove-arc"
            />
            {/* pressed highlight along the top of the groove */}
            <path
              d={d}
              fill="none"
              stroke="rgba(255,248,232,0.5)"
              strokeWidth={Math.max(1, width * 0.13)}
              strokeLinecap="round"
              className="groove-gloss"
            />
            {fits && (
              <>
                <defs>
                  <path
                    id={labelPathId}
                    fill="none"
                    d={
                      // under the record's equator the label has to run the
                      // other way, or it reads upside down
                      arcRunsUnderside(arc.start, arc.end)
                        ? arcPathReversed(
                            CENTER,
                            CENTER,
                            radius - labelOffset + labelSize * 0.32,
                            arc.start,
                            arc.end
                          )
                        : arcPath(
                            CENTER,
                            CENTER,
                            radius + labelOffset - labelSize * 0.32,
                            arc.start,
                            arc.end
                          )
                    }
                  />
                </defs>
                <text
                  className="groove-label font-type"
                  fontSize={labelSize}
                  fill="rgba(244,237,218,1)"
                  letterSpacing="1.5"
                  pointerEvents="none"
                >
                  <textPath href={`#${labelPathId}`} startOffset="50%" textAnchor="middle">
                    {name}
                  </textPath>
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* generous transparent hit area, drawn last so it wins the pointer */}
      {arcs.map((arc, i) => (
        <path
          key={`hit-${i}`}
          d={arcPath(CENTER, CENTER, radius, arc.start, arc.end)}
          fill="none"
          stroke="transparent"
          strokeWidth={hit}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

/* ---------- the paper label in the middle ---------- */

function CenterArtwork({
  uid,
  artworkUrl,
  labelColor,
  labelTitle,
  song,
  emptyNote,
}: {
  uid: string;
  artworkUrl?: string;
  labelColor: string;
  labelTitle: string;
  song: Song | null;
  emptyNote?: string;
}) {
  const size = R_LABEL * 2;
  const titleLines = artworkUrl ? [] : wrapText(song?.title ?? emptyNote ?? "", 18, 2);

  return (
    <g>
      <circle cx={CENTER} cy={CENTER} r={R_LABEL + 5} fill="rgba(10,8,5,0.9)" />

      {artworkUrl ? (
        <g key={artworkUrl} className="art-swap">
          <image
            href={artworkUrl}
            x={CENTER - R_LABEL}
            y={CENTER - R_LABEL}
            width={size}
            height={size}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${uid}-label-clip)`}
          />
          {/* a whisper of print texture, matching the paper elsewhere */}
          <circle cx={CENTER} cy={CENTER} r={R_LABEL} fill={`url(#${uid}-print)`} />
        </g>
      ) : (
        <g key={`${labelColor}-${labelTitle}-${song?.title ?? ""}`} className="art-swap">
          <circle cx={CENTER} cy={CENTER} r={R_LABEL} fill={labelColor} />
          <circle cx={CENTER} cy={CENTER} r={R_LABEL} fill={`url(#${uid}-print)`} />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={R_LABEL - 14}
            fill="none"
            stroke="rgba(250,244,228,0.34)"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
          <text
            className="font-type"
            fontSize="13"
            fill="rgba(250,244,228,0.82)"
            letterSpacing="1.8"
          >
            <textPath href={`#${uid}-label-arc`} startOffset="50%" textAnchor="middle">
              {truncate(labelTitle.toUpperCase(), 26)}
            </textPath>
          </text>
          {titleLines.map((line, i) => (
            <text
              key={i}
              x={CENTER}
              y={CENTER + 2 + i * 28 - (titleLines.length - 1) * 14}
              textAnchor="middle"
              className="font-heading"
              fontSize="24"
              fontStyle="italic"
              fill="rgba(252,247,234,0.96)"
            >
              {line}
            </text>
          ))}
          {song?.artist && (
            <text
              x={CENTER}
              y={CENTER + 40 + (titleLines.length - 1) * 14}
              textAnchor="middle"
              className="font-type"
              fontSize="14"
              fill="rgba(250,244,228,0.78)"
            >
              {truncate(song.artist, 26)}
            </text>
          )}
        </g>
      )}

      <circle
        cx={CENTER}
        cy={CENTER}
        r={R_LABEL}
        fill="none"
        stroke="rgba(20,16,11,0.55)"
        strokeWidth="2"
      />
    </g>
  );
}

/* ---------- helpers ---------- */

function decorativeGrooves(): { r: number; opacity: number; width: number }[] {
  const out: { r: number; opacity: number; width: number }[] = [];
  for (let r = 168, i = 0; r <= 470; r += 6.4, i++) {
    // a slow ripple in brightness keeps the surface from looking screen-printed
    const ripple = (Math.sin(i * 0.7) + Math.sin(i * 0.23)) * 0.5;
    out.push({ r, opacity: 0.05 + ripple * 0.018, width: i % 5 === 0 ? 1.3 : 0.85 });
  }
  return out;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/** SVG text doesn't wrap — split on words into at most `maxLines`. */
function wrapText(text: string, perLine: number, maxLines: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > perLine && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  const last = lines.length - 1;
  if (last >= 0) lines[last] = truncate(lines[last], perLine + 3);
  return lines;
}
