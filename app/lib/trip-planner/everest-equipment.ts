import type { TripPlan } from "./schema";

export const EVEREST_EQUIPMENT_SOURCE = {
  label: "Alpine Ascents · Everest equipment checklist",
  url: "https://www.alpineascents.com/climbs/mount-everest/gear-list/",
};

// South Col preparation reference. Confirm specifications and team supplies
// with the expedition operator; owning this equipment does not establish readiness.
export function getEverestEquipment(): TripPlan["itinerary"]["equipment"] {
  return {
    mustHave: [
      "Crampons — steel, 12-point, with anti-balling plates; fit them to your expedition boots",
      "Mountaineering ice axe — sized for you and approved by your operator",
      "High-altitude boots — insulated 8,000 m expedition system compatible with your crampons",
      "Climbing helmet — fits over headwear and securely holds your headlamp",
      "Alpine harness — adjustable over expedition clothing",
      "Fixed-rope ascender — compatible with the operator’s rope system",
      "Rappel device, locking carabiners, and safety attachments — operator-approved configuration",
      "Accessory cord and glacier-rescue equipment — quantities and system confirmed with your guide",
      "Expedition down suit, or 8,000 m parka and insulated expedition trousers",
      "Layering system — base layers, insulation, waterproof jacket and trousers",
      "Expedition mittens, insulated gloves, liners, and spare hand protection",
      "Glacier sunglasses, storm goggles, balaclavas, and warm hat",
      "Expedition sleeping bag and insulated sleeping mats — operator-approved temperature ratings",
      "Headlamp, spare batteries, and protected backup power",
      "Water bottles, insulation, water treatment, and food for climbing days",
      "Personal first-aid supplies and medication reviewed with a qualified clinician",
      "Supplemental oxygen, mask, regulator, and reserve supply — confirm the expedition’s system and provision",
      "Team-provided essentials — confirm tents, ropes, communications, cooking, and emergency arrangements",
    ],
    importantToHave: [
      "Trekking poles with snow baskets — for the approach and suitable snow terrain",
      "Approach traction — ask whether microspikes are needed; they do not replace climbing crampons",
      "Dry bags — protect spare layers, sleeping equipment, and electronics",
      "Equipment repair supplies — agree spare straps, batteries, and replacement parts with your operator",
      "Charging plan — confirm power availability and battery performance in extreme cold",
    ],
    niceToHave: [],
  };
}
