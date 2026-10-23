import type { MountainCatalogEntry } from "../../data/mountains";

// A direct location refinement replaces this dimension; other preferences survive.
// Undefined means the message did not supply a location update; [] means anywhere.
export function getLatestLocationPreference(
  message: string,
  mountains: Pick<MountainCatalogEntry, "location" | "region">[],
): string[] | undefined {
  const text = message.trim();
  const names = [...new Set(mountains.flatMap(({ location, region }) => [
    ...location.split(/[·,/]/).map((part) => part.trim()).filter(Boolean), region,
  ]))];
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const mentioned = names.filter((name) => new RegExp(`\\b${escape(name)}\\b`, "i").test(text));
  const directRequest = mentioned.some((name) => new RegExp(
    `(?:\\b(?:in|near|around|within)\\s+(?:the\\s+)?${escape(name)}\\b|\\b(?:what|how)\\s+about\\s+${escape(name)}\\b|^${escape(name)}[?.!]*$)`, "i",
  ).test(text));
  // A dream mountain's geography is not automatically the next trip's geography.
  const longTermOnly = /\b(?:someday|eventually|long[- ]term|ultimate|dream)\b/i.test(text) &&
    !/\b(?:next|this)\s+(?:trip|climb|adventure)\b/i.test(text);
  if (directRequest && !longTermOnly) {
    return mentioned.filter((name) => !mentioned.some(
      (other) => other !== name && other.toLowerCase().includes(name.toLowerCase()),
    ));
  }
  if (/\b(?:anywhere|worldwide|globally|any (?:country|region|location)|no (?:location|regional?|geographic) (?:preference|restrictions?|constraints?))\b/i.test(text)) {
    return [];
  }
  return undefined;
}
