import { formatMountainBudget, getMountainBudget } from "../../../data/mountain-budgets.ts";
import { getRouteTimes } from "../../../data/route-times.ts";
import type { MountainCatalogEntry } from "../../../data/mountains";
import { MOUNTAIN_EXPERIENCE } from "../../../lib/trip-planner/experience-levels.ts";
import type { TripInput, TripPlan } from "../../../lib/trip-planner/schema.ts";
import { formatTripDate } from "./format-trip-date.ts";
import { formatTripTiming } from "./format-trip-timing.ts";

type Equipment = TripPlan["itinerary"]["equipment"];

export function buildItineraryMarkdown({
  plan,
  input,
  summit,
  equipment,
}: {
  plan: TripPlan;
  input: TripInput;
  summit: MountainCatalogEntry;
  equipment: Equipment;
}) {
  const { itinerary } = plan;
  const mountainBudget = getMountainBudget(summit);
  const lines = [
    `# ${summit.name} adventure plan`,
    "",
    `- **When:** ${formatTripTiming(input.timing)}`,
    `- **Objective:** ${capitalize(input.objective)}`,
    `- **Experience:** ${MOUNTAIN_EXPERIENCE[input.experience].label}`,
    `- **Travelers:** ${input.travelers}`,
  ];

  if (input.objective === "summit") {
    lines.push(
      `- **Summit elevation:** ${summit.elevationMeters.toLocaleString("en-US")} m (${Math.round(summit.elevationMeters * 3.28084).toLocaleString("en-US")} ft)`,
    );
  }

  lines.push("", itinerary.summary, "", "## Travel timing", "", itinerary.timingNote);
  lines.push(
    "",
    "## Route budget reference",
    "",
    `${formatMountainBudget(mountainBudget)} per person · ${mountainBudget.basis}`,
    "",
    itinerary.budgetNote,
  );

  appendWarnings(lines, itinerary.warnings);
  appendSchedule(lines, plan, input, summit);
  appendEquipment(lines, equipment);
  appendListSection(lines, "Assumptions & things to confirm", itinerary.assumptions);

  lines.push(
    "",
    "---",
    "AI-generated planning draft. Transport, prices, route access, and conditions have not been checked live.",
  );

  return `${lines.join("\n").trim()}\n`;
}

export function itineraryMarkdownFilename(mountainName: string) {
  const slug = mountainName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug || "trip"}-itinerary.md`;
}

function appendWarnings(
  lines: string[],
  warnings: TripPlan["itinerary"]["warnings"],
) {
  if (!warnings.length) return;

  lines.push("", "## Warnings", "");
  for (const warning of warnings) {
    lines.push(`- **${capitalize(warning.severity)}: ${warning.title}.** ${warning.message}`);
  }
}

function appendSchedule(
  lines: string[],
  plan: TripPlan,
  input: TripInput,
  summit: MountainCatalogEntry,
) {
  const { dates } = plan;
  const references = getRouteTimes(summit.id, input.objective);

  lines.push("", "## Itinerary", "");

  if (plan.itinerary.phases.length) {
    for (const phase of plan.itinerary.phases) {
      const weekStart = Math.ceil(phase.startDay / 7);
      const weekEnd = Math.ceil(phase.endDay / 7);
      const weekLabel =
        weekStart === weekEnd
          ? `Week ${weekStart}`
          : `Weeks ${weekStart}–${weekEnd}`;
      const dateRange = getPhaseDateRange(dates, phase.startDay, phase.endDay);
      const phasePeriod = dateRange
        ? `${weekLabel} · Days ${phase.startDay}–${phase.endDay} · ${dateRange}`
        : `${weekLabel} · Days ${phase.startDay}–${phase.endDay}`;

      lines.push(
        `### ${phasePeriod}: ${phase.title}`,
        "",
        ...phase.activities.map((activity) => `- ${activity}`),
      );

      appendEnvironment(lines, phase.environment);
      appendMovement(lines, phase.effort, references);
      lines.push(`- **Stay:** ${phase.overnight}`);
      lines.push(`- **Before moving on:** ${phase.decisionNote}`, "");
    }
    return;
  }

  for (const [index, day] of plan.itinerary.days.entries()) {
    const date = plan.dates[index] ? ` · ${formatTripDate(plan.dates[index])}` : "";
    lines.push(`### Day ${index + 1}${date}: ${day.title}`, "");
    lines.push(...day.activities.map((activity) => `- ${activity}`));
    appendEnvironment(lines, day.environment);
    appendMovement(lines, day.effort, references);
    lines.push(`- **Overnight:** ${day.overnight}`, "");
  }
}

function getPhaseDateRange(dates: string[], startDay: number, endDay: number) {
  const firstDate = dates[startDay - 1];
  const lastDate = dates[endDay - 1];

  if (!firstDate || !lastDate) return "";
  if (firstDate === lastDate) return formatTripDate(firstDate);

  return `${formatTripDate(firstDate)} – ${formatTripDate(lastDate)}`;
}

function appendEnvironment(
  lines: string[],
  environment: TripPlan["itinerary"]["days"][number]["environment"],
) {
  lines.push(
    "",
    `- **Altitude:** ${environment.altitude}`,
    `- **Typical temperature:** ${environment.temperature}`,
    `- **Conditions:** ${environment.conditions}`,
  );
}

function appendMovement(
  lines: string[],
  effort: TripPlan["itinerary"]["days"][number]["effort"],
  references: ReturnType<typeof getRouteTimes>,
) {
  const movement = effort.filter(
    (item) => item.activity !== "rest" && item.activity !== "travel",
  );
  if (!movement.length) return;

  lines.push("", "**Hiking & climbing time**", "");

  for (const item of movement) {
    const timing = references.find(
      (reference) =>
        reference.id === item.timingId && reference.activity === item.activity,
    );
    const hours = timing
      ? `${timing.minHours}–${timing.maxHours} hours · ${timing.scope} ([route-time source](${timing.sourceUrl}))`
      : `Approx. ${item.estimatedHours?.replace("-", "–")} hours`;
    lines.push(`- **${timing?.label ?? item.label}:** ${hours}`);
  }
}

function appendEquipment(lines: string[], equipment: Equipment) {
  const groups = [
    { title: "Must have", items: equipment.mustHave },
    { title: "Important to have", items: equipment.importantToHave },
  ];
  lines.push("", "## Equipment required", "");

  for (const group of groups) {
    lines.push(`### ${group.title}`, "");
    if (group.items.length) {
      lines.push(...group.items.map((item) => `- ${item}`), "");
    } else {
      lines.push("- No items listed.", "");
    }
  }
}

function appendListSection(lines: string[], title: string, items: string[]) {
  if (!items.length) return;
  lines.push("", `## ${title}`, "", ...items.map((item) => `- ${item}`));
}

function capitalize(value: string) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}
