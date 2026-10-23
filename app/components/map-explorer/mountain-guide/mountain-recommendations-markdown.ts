export type MountainRecommendationExportOption = {
  name: string;
  objective: "visit" | "trek" | "summit";
  location: string;
  elevationMeters: number;
  difficulty: string;
  ascent: string;
  tripLength: string;
  budget: string;
  budgetBasis: string;
  budgetSource: string;
  description: string;
  rating?: "low" | "medium" | "strong" | "very strong";
  reason: string;
};

export function buildMountainRecommendationsMarkdown({
  experience,
  options,
}: {
  experience: string;
  options: MountainRecommendationExportOption[];
}): string {
  const sections = options.map((option, index) => {
    const objective = option.objective[0].toUpperCase() + option.objective.slice(1);

    return [
      `## ${index + 1}. ${cleanLine(option.name)} · ${objective}`,
      "",
      `- **Location:** ${cleanLine(option.location)}`,
      `- **Elevation:** ${option.elevationMeters.toLocaleString()} m`,
      `- **Difficulty:** ${cleanLine(option.difficulty)} · ${cleanLine(option.ascent)}`,
      `- **Typical trip length:** ${cleanLine(option.tripLength)}`,
      `- **Estimated budget:** ${cleanLine(option.budget)} per person`,
      `- **Estimate basis:** ${cleanLine(option.budgetBasis)}`,
      `- **Budget reference:** ${cleanLine(option.budgetSource)}`,
      "",
      cleanLine(option.description),
      "",
      ...(option.rating ? [`**Match:** ${option.rating}`, ""] : []),
      `**Why it may fit:** ${cleanLine(option.reason)}`,
    ].join("\n");
  });

  return [
    "# Your mountain recommendations",
    "",
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    `Experience selected: ${cleanLine(experience)}`,
    "",
    "AI-generated planning suggestions based on your chat and session summit list. Verify route details and conditions before making plans.",
    "",
    ...sections,
    "",
  ].join("\n");
}

// Keep model-generated text on one line so it cannot add headings to the export.
function cleanLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}
