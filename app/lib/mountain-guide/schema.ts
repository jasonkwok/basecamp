import type { UIMessage } from "ai";
import { z } from "zod";
import { MOUNTAINS } from "../../data/mountains";
import { tripInputSchema, type TripInput } from "../trip-planner/schema";

const mountainIds = MOUNTAINS.map((mountain) => mountain.id) as [
  string,
  ...string[],
];

export const mountainGuideExperienceSchema = tripInputSchema.shape.experience;

export const mountainRecommendationSchema = z.object({
  mountainId: z.enum(mountainIds),
  objective: tripInputSchema.shape.objective,
  rating: z.enum(["low", "medium", "strong", "very strong"]),
  reason: z.string().min(1).max(300),
});

const preferenceKeySchema = z.enum(["location", "altitude", "duration", "skills", "budget"]);

export const mountainGuidePreferencesSchema = z.object({
  goal: z.string().max(300).nullable(),
  locations: z.array(z.string().min(1).max(100)).max(10),
  minAltitudeMeters: z.number().nonnegative().nullable(),
  maxAltitudeMeters: z.number().nonnegative().nullable(),
  maxTripDays: z.number().positive().nullable(),
  skills: z.array(z.string().max(100)).max(10),
  budget: z.string().max(200).nullable(),
  firmRequirements: z.array(preferenceKeySchema).max(5),
  relaxedPreferences: z.array(preferenceKeySchema).max(5),
});

export type MountainGuidePreferences = z.infer<typeof mountainGuidePreferencesSchema>;

export const mountainGuideOutputSchema = z.object({
  intent: z.enum(["discovery", "recommendations", "answer"]),
  unmatchedPreferences: z.array(preferenceKeySchema).max(5),
  preferences: mountainGuidePreferencesSchema,
  reply: z.string().min(1).max(800),
  // An empty list lets the guide ask for missing context before making a guess.
  recommendations: z.array(mountainRecommendationSchema).max(5),
});

export const mountainRecommendationCardSchema = z.object({
  mountainId: z.enum(mountainIds),
  objective: tripInputSchema.shape.objective,
  rating: z.enum(["low", "medium", "strong", "very strong"]),
  reason: z.string().min(1).max(300),
});

export const mountainGuideDataSchemas = {
  "mountain-recommendations": z.array(mountainRecommendationCardSchema).max(5),
};

export type MountainExperience = TripInput["experience"];
export type MountainRecommendation = z.infer<
  typeof mountainRecommendationCardSchema
>;
export type MountainGuideMessage = UIMessage<
  never,
  { "mountain-recommendations": MountainRecommendation[] }
>;
