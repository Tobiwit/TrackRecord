export interface Mood {
  key: string;
  label: string;
  hint: string;
}

export const MOODS: Mood[] = [
  { key: "sun", label: "going good", hint: "sun" },
  { key: "rose", label: "romantic", hint: "rose" },
  { key: "moon", label: "confusing", hint: "moon" },
  { key: "flag", label: "red flag", hint: "tiny flag" },
  { key: "rain", label: "sad", hint: "rain cloud" },
  { key: "lightning", label: "chaotic", hint: "lightning" },
  { key: "star", label: "iconic", hint: "star" },
  { key: "brokenheart", label: "ending", hint: "broken heart" },
  { key: "sprout", label: "hopeful", hint: "sprout" },
  { key: "eye", label: "obsessed", hint: "eye" },
  { key: "key", label: "secret", hint: "key" },
  { key: "flame", label: "dramatic", hint: "flame" },
];

export function mood(key: string): Mood {
  return MOODS.find((m) => m.key === key) ?? MOODS[0];
}
