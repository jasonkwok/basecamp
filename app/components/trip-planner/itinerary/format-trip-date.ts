const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "UTC",
});

// Date-only values must not shift to the previous day in the traveler's timezone.
export function formatTripDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}
