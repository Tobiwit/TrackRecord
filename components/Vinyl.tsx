/** A little vinyl record. Set `spinning` to rotate it. */
export function Vinyl({
  size = 56,
  spinning = false,
  labelColor = "#a98a3e",
  className = "",
}: {
  size?: number;
  spinning?: boolean;
  labelColor?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 60 60"
      width={size}
      height={size}
      className={`${spinning ? "vinyl-spinning" : ""} ${className}`}
      style={{ transformOrigin: "50% 50%" }}
      role="img"
      aria-label={spinning ? "record spinning" : "vinyl record"}
    >
      <circle cx="30" cy="30" r="28" fill="#211b15" />
      <circle cx="30" cy="30" r="28" fill="none" stroke="rgba(240,230,210,0.25)" strokeWidth="1" />
      <circle cx="30" cy="30" r="23" fill="none" stroke="rgba(240,230,210,0.12)" strokeWidth="0.8" />
      <circle cx="30" cy="30" r="19" fill="none" stroke="rgba(240,230,210,0.1)" strokeWidth="0.8" />
      <circle cx="30" cy="30" r="15" fill="none" stroke="rgba(240,230,210,0.12)" strokeWidth="0.8" />
      {/* light glint */}
      <path d="M12 16a23 23 0 0 1 11-8" fill="none" stroke="rgba(240,230,210,0.35)" strokeWidth="1.4" strokeLinecap="round" />
      {/* label */}
      <circle cx="30" cy="30" r="9.5" fill={labelColor} opacity="0.9" />
      <circle cx="30" cy="30" r="9.5" fill="none" stroke="rgba(43,33,24,0.4)" strokeWidth="0.8" />
      <circle cx="30" cy="30" r="1.6" fill="#211b15" />
    </svg>
  );
}
