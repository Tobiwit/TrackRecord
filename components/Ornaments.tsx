/** Original ink-drawn collage ornaments — butterflies, sprigs, celestial faces. */

const ink = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function Butterfly({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      {/* body */}
      <path d="M24 14c-1.2 4-1.2 16 0 20" {...ink} strokeWidth={1.6} />
      <path d="M24 14c-1.5-2.5-4-4-6-4.5M24 14c1.5-2.5 4-4 6-4.5" {...ink} />
      {/* left wings */}
      <path d="M23 18c-5-6-13-8-16-5-2.6 2.6-.5 8.5 5 12-4 1-6 4-4.5 6.5 1.8 3 9 2 14.5-4" {...ink} />
      <path d="M20 20c-3-2.5-7-3.5-9-2.5M19 28c-2.5.5-4.5 1.6-5.5 3" {...ink} strokeWidth={0.9} />
      {/* right wings */}
      <path d="M25 18c5-6 13-8 16-5 2.6 2.6.5 8.5-5 12 4 1 6 4 4.5 6.5-1.8 3-9 2-14.5-4" {...ink} />
      <path d="M28 20c3-2.5 7-3.5 9-2.5M29 28c2.5.5 4.5 1.6 5.5 3" {...ink} strokeWidth={0.9} />
      {/* wing spots */}
      <circle cx="13" cy="17" r="1.6" {...ink} strokeWidth={0.9} />
      <circle cx="35" cy="17" r="1.6" {...ink} strokeWidth={0.9} />
    </svg>
  );
}

export function Sprig({ className = "w-10 h-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 56" className={className} aria-hidden>
      <path d="M16 54C14 38 15 18 18 2" {...ink} />
      <path d="M17 10c4-4 8-5 11-4-1 4-4 7-9 8M16 20c-4-3-8-3.5-11-2 1.5 3.5 5 6 10 6M17 30c4-3.5 8-4 11-2.5-1.5 4-5 6.5-10 7M16 40c-4-3-8-3.5-11-2 1.5 3.5 5 6 10 6" {...ink} strokeWidth={1.1} />
    </svg>
  );
}

export function SunFace({ className = "w-14 h-14" }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={className} aria-hidden>
      <circle cx="28" cy="28" r="12" {...ink} />
      {/* wavy rays */}
      <path d="M28 10l1.5 4M28 46l-1.5-4M10 28l4 1.5M46 28l-4-1.5M15 15l3.5 2.5M41 41l-3.5-2.5M41 15l-2.5 3.5M15 41l2.5-3.5" {...ink} strokeWidth={1.1} />
      <path d="M20 12.5l2 2.6M36 12.5l-2 2.6M12.5 20l2.6 2M12.5 36l2.6-2M43.5 20l-2.6 2M43.5 36l-2.6-2M20 43.5l2-2.6M36 43.5l-2-2.6" {...ink} strokeWidth={0.8} />
      {/* face */}
      <path d="M23.5 26c.5-1 1.8-1 2.3 0M30.2 26c.5-1 1.8-1 2.3 0" {...ink} strokeWidth={1} />
      <path d="M25 33c1.8 1.6 4.2 1.6 6 0" {...ink} strokeWidth={1} />
      <path d="M28 28.5v2.5" {...ink} strokeWidth={0.8} />
    </svg>
  );
}

export function MoonFace({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path d="M30 6a19 19 0 1 0 11 24A15 15 0 0 1 30 6Z" {...ink} />
      <path d="M22 22c.5-1 1.7-1 2.2 0" {...ink} strokeWidth={1} />
      <path d="M18 30c1.4 1.3 3.2 1.4 4.6.4" {...ink} strokeWidth={1} />
      <path d="M14 14l1 2.2M10 24l2 .8M12 34l1.8-.8" {...ink} strokeWidth={0.7} />
    </svg>
  );
}

export function Dove({ className = "w-12 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 32" className={className} aria-hidden>
      <path d="M8 20c6 2 14 2 19-2 3-2.5 5-6 4-10-3 0-6 2-7 5-4-4-12-5-18-1 3 1.5 5 3 6 5-3 .5-6 2-4 3Z" {...ink} />
      <path d="M27 18c4 1 9 .5 13-2-2 5-7 9-13 9-5 0-9-2-11-4" {...ink} />
      <circle cx="28.5" cy="11" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
