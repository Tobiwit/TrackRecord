export interface StandardEvent {
  key: string;
  label: string;
  moodIcon: string; // default mood for this event
}

export const STANDARD_EVENTS: StandardEvent[] = [
  { key: "first_kiss", label: "First kiss", moodIcon: "rose" },
  { key: "we_clicked", label: "We clicked", moodIcon: "star" },
  { key: "first_date", label: "First date", moodIcon: "sprout" },
  { key: "sleepover", label: "Sleepover", moodIcon: "moon" },
  { key: "met_friends", label: "Met friends", moodIcon: "sun" },
  { key: "red_flag", label: "Red flag", moodIcon: "flag" },
  { key: "mixed_signals", label: "Mixed signals", moodIcon: "moon" },
  { key: "soft_launch", label: "Soft launch", moodIcon: "eye" },
  { key: "the_talk", label: "The talk", moodIcon: "flame" },
  { key: "it_ended", label: "It ended", moodIcon: "brokenheart" },
  { key: "back_again", label: "Back again", moodIcon: "lightning" },
  { key: "no_contact", label: "No contact", moodIcon: "key" },
  { key: "situationship", label: "Situationship detected", moodIcon: "moon" },
];

export function standardEvent(key: string): StandardEvent | undefined {
  return STANDARD_EVENTS.find((e) => e.key === key);
}
