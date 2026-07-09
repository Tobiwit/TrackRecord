import type { Person, User } from "@/lib/types";
import { accent } from "@/lib/colors";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const MOTIFS = ["moon", "sun", "rose", "star", "key", "ivy"] as const;
type Motif = (typeof MOTIFS)[number];

function MotifArt({ motif }: { motif: Motif }) {
  const s = {
    fill: "none",
    stroke: "rgba(240,230,210,0.85)",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (motif) {
    case "moon":
      return <path d="M26 8a12 12 0 1 0 7 14.6A9.4 9.4 0 0 1 26 8Z" {...s} />;
    case "sun":
      return (
        <>
          <circle cx="20" cy="20" r="6" {...s} />
          <path d="M20 8v3M20 29v3M8 20h3M29 20h3M11.5 11.5l2 2M26.5 26.5l2 2M28.5 11.5l-2 2M13.5 26.5l-2 2" {...s} />
        </>
      );
    case "rose":
      return (
        <>
          <path d="M20 22c-3.4 0-5.4-2-5.3-4.7.1-2.4 2.3-4.2 5.3-4.2s5.2 1.8 5.3 4.2c.1 2.7-1.9 4.7-5.3 4.7Z" {...s} />
          <path d="M20 22v9M20 27c-2.2-.5-3.7-1.8-4.4-3.7" {...s} />
        </>
      );
    case "star":
      return <path d="M20 8l3 6.7 7.2.8-5.3 4.9 1.4 7.2L20 24l-6.3 3.6 1.4-7.2-5.3-4.9 7.2-.8L20 8Z" {...s} />;
    case "key":
      return (
        <>
          <circle cx="15" cy="15" r="5" {...s} />
          <path d="M18.6 18.6 30 30M26 26l3-3M22.5 22.5l2.4-2.4" {...s} />
        </>
      );
    case "ivy":
      return (
        <>
          <path d="M20 32V13" {...s} />
          <path d="M20 20c0-4.4-2.9-7.2-7.3-7.2 0 4.4 2.9 7.2 7.3 7.2ZM20 26c0-3.8 2.5-6.1 6.2-6.1 0 3.8-2.5 6.1-6.2 6.1Z" {...s} />
        </>
      );
  }
}

/**
 * Stylized person avatar — never shows the original uploaded photo.
 * A muted accent-colored disc with an ink motif and the person's initial,
 * consistent across the app (motif is derived from the name).
 */
export function PersonAvatar({
  person,
  size = 44,
  className = "",
}: {
  person: Person;
  size?: number;
  className?: string;
}) {
  const color = accent(person.color);
  const motif = MOTIFS[hashString(person.name + person.id) % MOTIFS.length];
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`${person.name} (stylized avatar)`}
    >
      <circle cx="20" cy="20" r="19" fill={color.hex} />
      <circle cx="20" cy="20" r="19" fill="none" stroke="rgba(43,33,24,0.45)" strokeWidth="1.2" />
      <circle cx="20" cy="20" r="15.5" fill="none" stroke="rgba(240,230,210,0.3)" strokeWidth="0.8" strokeDasharray="2 3" />
      <g opacity="0.55">
        <MotifArt motif={motif} />
      </g>
      <text
        x="20"
        y="25.5"
        textAnchor="middle"
        fontSize="15"
        fontFamily="Georgia, serif"
        fill="rgba(240,230,210,0.95)"
        fontStyle="italic"
      >
        {person.name.charAt(0).toUpperCase()}
      </text>
    </svg>
  );
}

/** User avatar: profile picture if present, otherwise an initialed paper disc. */
export function UserAvatar({
  user,
  size = 44,
  className = "",
}: {
  user: User;
  size?: number;
  className?: string;
}) {
  if (user.profilePictureUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.profilePictureUrl}
        alt={user.displayName}
        width={size}
        height={size}
        className={`rounded-full object-cover border border-ink/40 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const hue = hashString(user.username) % MOTIFS.length;
  const bgs = ["#5a4232", "#6b6b3f", "#7d3b3f", "#a98a3e", "#7f8a6c", "#a95f33"];
  const initials = user.displayName
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} role="img" aria-label={user.displayName}>
      <circle cx="20" cy="20" r="19" fill={bgs[hue]} />
      <circle cx="20" cy="20" r="19" fill="none" stroke="rgba(43,33,24,0.45)" strokeWidth="1.2" />
      <text
        x="20"
        y="25"
        textAnchor="middle"
        fontSize="13"
        fontFamily="Georgia, serif"
        fill="rgba(240,230,210,0.95)"
      >
        {initials}
      </text>
    </svg>
  );
}
