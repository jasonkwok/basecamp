import type { Summit } from "./mountains";

export type MountainBudget = {
  minUsd: number;
  maxUsd: number;
  basis: string;
  confidence: "price-informed" | "rough-allowance";
  sourceUrl: string;
};

// Published price anchors reviewed October 21, 2026. Ranges are editorial
// allowances around examples, not minimum/maximum offers or personal quotes.
const MADISON = "https://madisonmountaineering.com/";
const PRICE_ANCHORS: Record<string, MountainBudget> = {
  everest: {
    minUsd: 55000,
    maxUsd: 100000,
    basis: "Supported South Col expedition",
    confidence: "price-informed",
    sourceUrl: MADISON,
  },
  k2: {
    minUsd: 45000,
    maxUsd: 95000,
    basis: "Supported Abruzzi Spur expedition",
    confidence: "price-informed",
    sourceUrl: MADISON,
  },
  "cho-oyu": {
    minUsd: 45000,
    maxUsd: 70000,
    basis: "Supported northwest-face expedition",
    confidence: "price-informed",
    sourceUrl: MADISON,
  },
  "broad-peak": {
    minUsd: 35000,
    maxUsd: 65000,
    basis: "Supported summit expedition",
    confidence: "price-informed",
    sourceUrl: MADISON,
  },
  denali: {
    minUsd: 13000,
    maxUsd: 22000,
    basis: "Guided West Buttress expedition",
    confidence: "price-informed",
    sourceUrl: MADISON,
  },
  vinson: {
    minUsd: 55000,
    maxUsd: 70000,
    basis: "Guided expedition including Antarctic access flights",
    confidence: "price-informed",
    sourceUrl:
      "https://www.alpineascents.com/climbs/mount-vinson/price-schedule/",
  },
  "carstensz-pyramid": {
    minUsd: 25000,
    maxUsd: 35000,
    basis: "Guided technical summit expedition",
    confidence: "price-informed",
    sourceUrl: MADISON,
  },
  aconcagua: {
    minUsd: 6500,
    maxUsd: 13000,
    basis: "Supported Normal Route expedition",
    confidence: "price-informed",
    sourceUrl: MADISON,
  },
  kilimanjaro: {
    minUsd: 3500,
    maxUsd: 11000,
    basis: "Guided multi-day summit trek; route and service level vary",
    confidence: "price-informed",
    sourceUrl: MADISON,
  },
  "mount-kenya": {
    minUsd: 5000,
    maxUsd: 10000,
    basis: "Guided technical Batian ascent, not the Point Lenana trek",
    confidence: "price-informed",
    sourceUrl: MADISON,
  },
  "ama-dablam": {
    minUsd: 12000,
    maxUsd: 24000,
    basis: "Supported Southwest Ridge expedition",
    confidence: "price-informed",
    sourceUrl: MADISON,
  },
};

const roundUp = (amount: number) => Math.ceil(amount / 50) * 50;

// Every catalog route gets an explicit planning allowance. Where an individual
// price is unverified, use broad comparable-trip bands and disclose that basis.
// This is intentionally separate from the user's origin-dependent travel costs.
export function getMountainBudget(
  summit: Pick<Summit, "id" | "difficulty" | "tripLength">,
): MountainBudget {
  const anchor = PRICE_ANCHORS[summit.id];
  if (anchor) return anchor;

  const level = summit.difficulty.level;
  if (level === "extreme") {
    return {
      minUsd: 25000,
      maxUsd: 70000,
      basis:
        "Supported 8,000 m summit expedition; services and permits vary widely",
      confidence: "rough-allowance",
      sourceUrl: MADISON,
    };
  }

  if (level === "expert") {
    return {
      minUsd: roundUp(Math.max(1500, summit.tripLength.minDays * 350)),
      maxUsd: roundUp(Math.max(5000, summit.tripLength.maxDays * 900)),
      basis: "Guided technical ascent with shared logistics",
      confidence: "rough-allowance",
      sourceUrl: MADISON,
    };
  }

  const multiDay = summit.tripLength.maxDays > 1;
  return {
    minUsd: roundUp(
      Math.max(50, summit.tripLength.minDays * (multiDay ? 100 : 50)),
    ),
    maxUsd: roundUp(
      Math.max(300, summit.tripLength.maxDays * (multiDay ? 400 : 300)),
    ),
    basis: multiDay
      ? "Multi-day walking or trekking allowance; local support varies"
      : "Local day hike or site visit; independent travel where permitted",
    confidence: "rough-allowance",
    sourceUrl: summit.tripLength.sourceUrl,
  };
}

export function formatMountainBudget(
  budget: Pick<MountainBudget, "minUsd" | "maxUsd">,
) {
  const dollars = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  return `${dollars.format(budget.minUsd)}–${dollars.format(budget.maxUsd)} USD`;
}
