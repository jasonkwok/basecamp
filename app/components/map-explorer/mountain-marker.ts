import type { Summit } from "../../data/mountains";
import { findMountainRangeForGroup } from "../../data/mountain-ranges";
import { MOUNTAIN_TAGS, type MountainTagId } from "../../data/mountain-tags";
import { DIFFICULTY_LEVELS } from "../../data/difficulty-levels";

export type MountainMarkerElements = {
  element: HTMLDivElement;
  button: HTMLButtonElement;
  name: HTMLSpanElement;
  badges: HTMLSpanElement;
  nearby: HTMLSpanElement;
};

// Mapbox owns these DOM nodes. Return the parts that clustering updates directly.
export function createMountainMarker(summit: Summit): MountainMarkerElements {
  const element = document.createElement("div");
  element.className = "mountain-marker";
  element.dataset.summitId = summit.id;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "mountain-hit-area";

  const location = document.createElement("span");
  location.className = "mountain-location";

  const { label, name, badges, nearby } = createMountainLabel(summit);

  button.append(createMountainIllustration(), location, label);
  element.append(button);

  return { element, button, name, badges, nearby };
}

// The button supplies the accessible name; the illustration is decorative.
function createMountainIllustration(): HTMLImageElement {
  const illustration = document.createElement("img");
  illustration.src = "/mountain-marker.svg";
  illustration.alt = "";
  illustration.width = 112;
  illustration.height = 90;

  return illustration;
}

function createMountainLabel(summit: Summit) {
  const label = document.createElement("span");
  label.className = "mountain-label";

  const name = document.createElement("span");
  name.textContent = summit.name;

  const badges = document.createElement("span");
  badges.className = "mountain-badges";

  badges.append(
    ...summit.tags.map(createTagBadge),
    createDifficultyBadge(summit),
  );

  const nearby = document.createElement("span");
  nearby.className = "mountain-nearby";
  nearby.hidden = true;

  label.append(name, badges, nearby);

  return { label, name, badges, nearby };
}

function createTagBadge(tagId: MountainTagId): HTMLSpanElement {
  const tag = MOUNTAIN_TAGS[tagId];
  const badge = document.createElement("span");
  badge.className = "mountain-badge";
  badge.dataset.tag = tagId;
  badge.title = tag.description;

  const icon = document.createElement("span");
  icon.className = "badge-emblem";
  icon.textContent = tag.icon;

  const text = document.createElement("span");
  text.textContent = tag.label;

  badge.append(icon, text);

  return badge;
}

function createDifficultyBadge(summit: Summit): HTMLSpanElement {
  const difficulty = DIFFICULTY_LEVELS[summit.difficulty.level];
  const badge = document.createElement("span");
  badge.className = "mountain-badge difficulty-badge";
  badge.dataset.difficulty = summit.difficulty.level;
  badge.textContent = `${difficulty.icon} ${difficulty.label}`;
  badge.title = `${difficulty.fullLabel} · ${summit.difficulty.ascent}`;

  return badge;
}

// Update only presentation; the explorer owns selection and click behavior.
export function updateMountainMarker(
  marker: MountainMarkerElements,
  mountains: Summit[],
  representative: Summit,
  isSelected: boolean,
) {
  const hasNearbyMountains = mountains.length > 1;

  // Unselected groups show a count; selected peaks retain their name and badges.
  const showMountainDetails = isSelected || !hasNearbyMountains;
  const range = hasNearbyMountains
    ? findMountainRangeForGroup(mountains.map((mountain) => mountain.coordinates))
    : null;

  marker.element.classList.toggle("is-selected", isSelected);
  marker.element.dataset.clusterCount = String(mountains.length);
  marker.name.textContent = showMountainDetails
    ? representative.name
    : range
      ? `${range.emoji} ${range.name}`
      : `${mountains.length} peaks`;
  marker.badges.hidden = !showMountainDetails;
  marker.nearby.hidden = !hasNearbyMountains;
  marker.nearby.textContent = isSelected
    ? `+${mountains.length - 1} nearby · explore`
    : "See nearby mountains";

  const accessibleLabel = describeMountainGroup(mountains, representative);

  marker.button.setAttribute("aria-label", accessibleLabel);
}

// Group labels enumerate hidden peaks so screen readers can discover them.
function describeMountainGroup(mountains: Summit[], representative: Summit) {
  if (mountains.length > 1) {
    const mountainNames = mountains.map((mountain) => mountain.name).join(", ");

    return `${mountains.length} nearby peaks. ${mountainNames}`;
  }

  const tagDescriptions = representative.tags
    .map((tag) => MOUNTAIN_TAGS[tag].description)
    .join(". ");

  return `${representative.name}, ${representative.region}. ${tagDescriptions}`;
}
