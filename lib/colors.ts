/** Accent colors assignable to People. Muted, vintage, scrapbook-friendly. */
export interface AccentColor {
  key: string;
  label: string;
  hex: string;
  soft: string; // low-opacity wash for card backgrounds
}

export const ACCENT_COLORS: AccentColor[] = [
  { key: "burgundy", label: "Faded Burgundy", hex: "#7d3b3f", soft: "rgba(125,59,63,0.14)" },
  { key: "olive", label: "Olive Green", hex: "#6b6b3f", soft: "rgba(107,107,63,0.14)" },
  { key: "rose", label: "Dusty Rose", hex: "#b57f78", soft: "rgba(181,127,120,0.16)" },
  { key: "gold", label: "Antique Gold", hex: "#a98a3e", soft: "rgba(169,138,62,0.15)" },
  { key: "burnt", label: "Burnt Orange", hex: "#a95f33", soft: "rgba(169,95,51,0.14)" },
  { key: "sage", label: "Muted Sage", hex: "#7f8a6c", soft: "rgba(127,138,108,0.16)" },
  { key: "espresso", label: "Espresso", hex: "#5a4232", soft: "rgba(90,66,50,0.13)" },
  { key: "moon", label: "Moonlight Grey", hex: "#7d7871", soft: "rgba(125,120,113,0.15)" },
];

export function accent(key: string): AccentColor {
  return ACCENT_COLORS.find((c) => c.key === key) ?? ACCENT_COLORS[0];
}

/** Pick a color key not already used by the given keys. */
export function nextFreeColor(used: string[]): string {
  const free = ACCENT_COLORS.find((c) => !used.includes(c.key));
  return (free ?? ACCENT_COLORS[used.length % ACCENT_COLORS.length]).key;
}
