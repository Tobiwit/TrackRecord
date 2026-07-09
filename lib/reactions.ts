export interface ReactionType {
  key: string;
  label: string;
}

export const REACTION_TYPES: ReactionType[] = [
  { key: "screaming", label: "screaming" },
  { key: "red_flag", label: "red flag" },
  { key: "finally", label: "finally" },
  { key: "i_knew_it", label: "I knew it" },
  { key: "no_babe", label: "no babe" },
  { key: "iconic", label: "iconic" },
  { key: "crying", label: "crying" },
  { key: "call_me", label: "call me" },
];

export function reactionLabel(key: string): string {
  return REACTION_TYPES.find((r) => r.key === key)?.label ?? key;
}
