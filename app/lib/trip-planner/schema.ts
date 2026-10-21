import { z } from "zod";

export const MAX_TRIP_DAYS = 21;
const MILLISECONDS_PER_DAY = 86_400_000;
export const CURRENCIES = [
  "USD",
  "CAD",
  "EUR",
  "GBP",
  "AUD",
  "NZD",
  "JPY",
  "CHF",
] as const;

// Date-only values use UTC arithmetic so daylight-saving changes cannot add a day.
export function tripDates(start: string, end: string): string[] {
  const departureTime = Date.parse(`${start}T00:00:00Z`);
  const returnTime = Date.parse(`${end}T00:00:00Z`);
  const dayCount =
    Math.floor((returnTime - departureTime) / MILLISECONDS_PER_DAY) + 1;

  if (!Number.isFinite(dayCount) || dayCount < 1 || dayCount > MAX_TRIP_DAYS)
    return [];

  return Array.from({ length: dayCount }, (_, index) =>
    new Date(departureTime + index * MILLISECONDS_PER_DAY)
      .toISOString()
      .slice(0, 10),
  );
}

export const tripInputSchema = z
  .object({
    mountainId: z.string().min(1).max(80),
    origin: z
      .string()
      .trim()
      .min(3, "Enter your departure city and country.")
      .max(120),
    departureDate: z.iso.date(),
    returnDate: z.iso.date(),
    travelers: z.number().int().min(1).max(12),
    objective: z.enum(["visit", "trek", "summit"]),
    experience: z.enum(["beginner", "regular", "technical"]),
    currency: z.enum(CURRENCIES),
    budget: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("unknown") }),
      z.object({
        kind: z.literal("known"),
        amount: z.number().positive().max(1_000_000),
      }),
    ]),
  })
  .superRefine(validateTravelWindow);

const shortTextSchema = z.string().min(1).max(700);

const itineraryDaySchema = z.object({
  title: z.string().min(1).max(120),
  activities: z.array(shortTextSchema).min(1).max(4),
  overnight: z.string().min(1).max(200),
});

// The model supplies activities; the server assigns and checks the actual dates.
export const itinerarySchema = z.object({
  status: z.enum(["draft", "needs-changes"]),
  summary: shortTextSchema,
  budgetNote: shortTextSchema,
  assumptions: z.array(shortTextSchema).max(8),
  days: z.array(itineraryDaySchema).max(MAX_TRIP_DAYS),
  equipment: z.array(z.string().min(1).max(200)).max(12),
});

export const tripPlanSchema = z
  .object({
    itinerary: itinerarySchema,
    dates: z.array(z.iso.date()).min(1).max(MAX_TRIP_DAYS),
  })
  .superRefine(validateItineraryDates);

export type TripInput = z.infer<typeof tripInputSchema>;
export type TripPlan = z.infer<typeof tripPlanSchema>;

// Date ordering and the length cap apply equally to form input and API requests.
function validateTravelWindow(
  input: { departureDate: string; returnDate: string },
  context: z.RefinementCtx,
) {
  if (!tripDates(input.departureDate, input.returnDate).length) {
    context.addIssue({
      code: "custom",
      path: ["returnDate"],
      message: `Choose a return date on or after departure, within ${MAX_TRIP_DAYS} days.`,
    });
  }

  if (input.departureDate < new Date().toISOString().slice(0, 10)) {
    context.addIssue({
      code: "custom",
      path: ["departureDate"],
      message: "Choose an upcoming departure date.",
    });
  }
}

// A draft covers every date; a request for changes contains no scheduled days.
function validateItineraryDates(
  {
    itinerary,
    dates,
  }: { itinerary: z.infer<typeof itinerarySchema>; dates: string[] },
  context: z.RefinementCtx,
) {
  const expectedDayCount = itinerary.status === "draft" ? dates.length : 0;

  if (itinerary.days.length !== expectedDayCount) {
    context.addIssue({
      code: "custom",
      path: ["itinerary", "days"],
      message: "The itinerary did not match the requested dates.",
    });
  }

  const expectedDates = tripDates(dates[0], dates[dates.length - 1]);
  const hasConsecutiveDates = dates.every(
    (date, index) => date === expectedDates[index],
  );

  if (!hasConsecutiveDates) {
    context.addIssue({
      code: "custom",
      path: ["dates"],
      message: "Trip dates must be consecutive.",
    });
  }
}
