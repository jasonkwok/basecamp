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
  reason: z.string().min(1).max(300),
});

export const mountainGuideOutputSchema = z.object({
  reply: z.string().min(1).max(800),
  // An empty list lets the guide ask for missing context before making a guess.
  recommendations: z.array(mountainRecommendationSchema).max(3),
});

export const mountainRecommendationCardSchema = z.object({
  mountainId: z.enum(mountainIds),
  objective: tripInputSchema.shape.objective,
  reason: z.string().min(1).max(300),
});

export const mountainGuideDataSchemas = {
  "mountain-recommendations": z.array(mountainRecommendationCardSchema),
};

export type MountainExperience = TripInput["experience"];
export type MountainRecommendation = z.infer<
  typeof mountainRecommendationCardSchema
>;
export type MountainGuideMessage = UIMessage<
  never,
  { "mountain-recommendations": MountainRecommendation[] }
>;
