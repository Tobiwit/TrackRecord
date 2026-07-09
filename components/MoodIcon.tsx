import { mood } from "@/lib/moods";

/**
 * Hand-drawn-style ink icons for each mood category.
 * Stroke-based, slightly irregular paths — scrapbook symbols, not app icons.
 */
export function MoodIcon({
  moodKey,
  className = "w-5 h-5",
  title,
}: {
  moodKey: string;
  className?: string;
  title?: string;
}) {
  const m = mood(moodKey);
  const label = title ?? m.label;
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  let art: React.ReactNode;
  switch (moodKey) {
    case "sun":
      art = (
        <>
          <circle cx="12" cy="12" r="4.2" {...common} />
          <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4L18 18M18 6l-1.6 1.6M7.6 16.4L6 18" {...common} />
        </>
      );
      break;
    case "rose":
      art = (
        <>
          <path d="M12 13.5c-2.4 0-3.8-1.5-3.7-3.4.1-1.7 1.6-3 3.7-3s3.6 1.3 3.7 3c.1 1.9-1.3 3.4-3.7 3.4Z" {...common} />
          <path d="M12 9.2c-.9 0-1.5.5-1.5 1.2 0 .8.6 1.3 1.5 1.3s1.5-.5 1.5-1.3c0-.7-.6-1.2-1.5-1.2Z" {...common} />
          <path d="M12 13.5v6.5M12 17c-1.6-.4-2.7-1.4-3.2-2.8M12 18.4c1.5-.4 2.5-1.2 3-2.5" {...common} />
        </>
      );
      break;
    case "moon":
      art = (
        <path d="M15.5 3.8a8 8 0 1 0 4.6 9.7 6.2 6.2 0 0 1-4.6-9.7Z" {...common} />
      );
      break;
    case "flag":
      art = (
        <>
          <path d="M6.5 21V4" {...common} />
          <path d="M6.5 4.5c3-1.6 5.5 1.4 8.7-.3l1 6.3c-3.2 1.7-5.7-1.3-8.7.3" {...common} />
        </>
      );
      break;
    case "rain":
      art = (
        <>
          <path d="M7 13.5a4.2 4.2 0 0 1-.4-8.4 5 5 0 0 1 9.7-.8 3.7 3.7 0 0 1 .9 7.3" {...common} />
          <path d="M9 16.5l-.8 2.3M13 16l-.8 2.3M17 16.5l-.8 2.3" {...common} />
        </>
      );
      break;
    case "lightning":
      art = (
        <path d="M13.5 3 6.5 13.2h4.2L9.5 21l7.5-10.6h-4.4l1-7.4Z" {...common} />
      );
      break;
    case "star":
      art = (
        <path d="M12 3.6l2.3 5 5.4.6-4 3.7 1.1 5.4L12 15.6l-4.8 2.7 1.1-5.4-4-3.7 5.4-.6 2.3-5Z" {...common} />
      );
      break;
    case "brokenheart":
      art = (
        <>
          <path d="M12 20.2S4 14.7 4 9.4C4 6.6 6 4.8 8.4 4.8c1.5 0 2.8.8 3.6 2 .8-1.2 2.1-2 3.6-2C18 4.8 20 6.6 20 9.4c0 5.3-8 10.8-8 10.8Z" {...common} />
          <path d="M12 7l-1.4 3 2.5 1.6-1.6 3.4" {...common} />
        </>
      );
      break;
    case "sprout":
      art = (
        <>
          <path d="M12 20.5V11" {...common} />
          <path d="M12 12.5c0-3.4-2.2-5.5-5.6-5.5 0 3.4 2.2 5.5 5.6 5.5ZM12 10c0-2.9 1.9-4.7 4.8-4.7 0 2.9-1.9 4.7-4.8 4.7Z" {...common} />
        </>
      );
      break;
    case "eye":
      art = (
        <>
          <path d="M2.8 12S6.5 6.2 12 6.2 21.2 12 21.2 12 17.5 17.8 12 17.8 2.8 12 2.8 12Z" {...common} />
          <circle cx="12" cy="12" r="2.6" {...common} />
        </>
      );
      break;
    case "key":
      art = (
        <>
          <circle cx="8" cy="8.5" r="3.7" {...common} />
          <path d="M10.7 11.2 19 19.5M16 16.5l2.2-2.2M13.5 14l1.8-1.8" {...common} />
        </>
      );
      break;
    case "flame":
      art = (
        <path d="M12 20.5c-3.6 0-6-2.3-6-5.6 0-3 2.4-4.7 3.4-7.1.5 1 .8 1.9.7 3.1 1.2-1.3 2-3.5 1.9-6.4 3 1.9 6 5.4 6 10.4 0 3.3-2.4 5.6-6 5.6Z" {...common} />
      );
      break;
    default:
      art = <circle cx="12" cy="12" r="6" {...common} />;
  }

  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={label}>
      <title>{label}</title>
      {art}
    </svg>
  );
}
