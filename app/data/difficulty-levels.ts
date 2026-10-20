// Basecamp editorial experience bands, not official climbing grades.
export const DIFFICULTY_LEVELS = {
  beginner: { label: "Beginner", fullLabel: "Beginner", icon: "🌱" },
  intermediate: { label: "Intermediate", fullLabel: "Intermediate", icon: "🥾" },
  difficult: { label: "Difficult", fullLabel: "Difficult", icon: "🧗" },
  expert: { label: "Expert", fullLabel: "Expert", icon: "💀" },
  extreme: { label: "Extreme", fullLabel: "Extreme", icon: "☠️" },
} as const;

export type DifficultyLevel = keyof typeof DIFFICULTY_LEVELS;
