import type { MountainCatalogEntry } from "../../data/mountains";
import type { TripInput, TripPlan } from "./schema";

type Equipment = TripPlan["itinerary"]["equipment"];
type MountainRoute = Pick<MountainCatalogEntry, "id" | "difficulty">;

// These catalog routes are technical rock climbs, rather than glacier ascents.
const ROCK_ROUTES = new Set([
  "carstensz-pyramid",
  "mount-kenya",
  "fitz-roy",
  "grand-teton",
]);

// A preparation baseline for every catalog entry, not a complete route checklist.
// Hiking systems: https://www.nps.gov/articles/10essentials.htm
// Expedition example: https://madisonmountaineering.com/wp-content/uploads/2019/08/K2-2024-K2-Expedition-gear-list.pdf
export function getEquipmentReference(
  summit: MountainRoute,
  objective: TripInput["objective"],
): Equipment {
  const mustHave = [
    "Walking boots or trail shoes — grip, support, and fit suited to the route",
    "Backpack — fitted and large enough for your daily equipment",
    "Waterproof jacket and trousers — protection from rain and wind",
    "Insulating layer — warmth suited to the expected conditions",
    "Sun protection — sunglasses, sunscreen, and a sun hat",
    "Navigation — offline route map and a backup you know how to use",
    "Headlamp — carry spare batteries or protected backup power",
    "Water bottles and sufficient drinking water — treatment where needed",
    "Food — enough for the outing plus an emergency reserve",
    "First-aid kit — include personal medication",
    "Emergency shelter — suitable for the terrain and conditions",
    "Emergency communication — confirm coverage and arrange satellite communication where needed",
  ];
  const importantToHave = [
    "Spare socks — keep a dry pair protected from moisture",
    "Spare gloves — suited to the temperature and weather",
    "Dry bags — protect spare clothing and electronics",
    "Trekking poles — where suitable for the trail",
    "Repair supplies — footwear, clothing, and equipment repairs",
  ];
  const niceToHave: string[] = [];

  // Visits and treks do not inherit the mountain's technical summit equipment.
  if (objective === "summit") {
    const level = summit.difficulty.level;
    const isTechnical = level === "expert" || level === "extreme";

    if (isTechnical) {
      mustHave.push(
        "Climbing helmet — sized to fit securely with your headwear",
        "Climbing harness — fitted over the clothing you will climb in",
        "Rope system — confirm ropes, anchors, and protection with your guide",
        "Belay/rappel device and locking carabiners — compatible with the route’s rope system",
      );

      if (ROCK_ROUTES.has(summit.id)) {
        mustHave.push(
          "Rock-climbing footwear — matched to the route and conditions",
          "Rock protection and slings — team rack agreed with your guide",
        );
      } else {
        mustHave.push(
          "Mountaineering ice axe",
          "Crampons",
          "Mountaineering boots — insulated as required and compatible with your crampons",
          "Glacier-rescue kit — pulleys, cord, and hardware agreed with your guide where glaciers are crossed",
          "Snow/ice protection — route-specific tools and hardware agreed with your guide",
        );
      }
    }

    if (level === "extreme") {
      mustHave.push(
        "Expedition down suit or expedition parka and insulated trousers — rated for the objective",
        "Expedition mittens — insulated liners and spare hand protection",
        "Glacier sunglasses and storm goggles — protection from glare, wind, and snow",
        "Expedition sleeping bag and sleeping mats — ratings approved by your operator",
        "Fixed-rope ascender and safety attachments — compatible with the operator’s system",
        "Supplemental oxygen system and reserves — confirm whether required and who supplies them",
        "Expedition tents, cooking system, communications, and rescue arrangements — confirm team provision",
      );
    }
  }

  return { mustHave, importantToHave, niceToHave };
}

export function mergeEquipmentReference(
  reference: Equipment,
  generated: Equipment,
): Equipment {
  // Keep baseline essentials out of lower-priority groups in the AI draft.
  const requiresSnowGear = reference.mustHave.some((item) =>
    /mountaineering ice axe/i.test(item),
  );
  const snowGear = /\b(ice ax(?:e|es)|ice tool(?:s)?|crampons?)\b/i;
  const isRequiredSnowGear = (item: string) =>
    requiresSnowGear && snowGear.test(item);
  const mustHave = [
    ...new Set([
      ...reference.mustHave,
      ...generated.mustHave,
      ...generated.importantToHave.filter(isRequiredSnowGear),
      ...generated.niceToHave.filter(isRequiredSnowGear),
    ]),
  ];
  const importantToHave = [
    ...new Set([...reference.importantToHave, ...generated.importantToHave]),
  ].filter((item) => !mustHave.includes(item) && !isRequiredSnowGear(item));
  const niceToHave = [
    ...new Set([...reference.niceToHave, ...generated.niceToHave]),
  ].filter(
    (item) =>
      !mustHave.includes(item) &&
      !importantToHave.includes(item) &&
      !isRequiredSnowGear(item),
  );

  return { mustHave, importantToHave, niceToHave };
}
