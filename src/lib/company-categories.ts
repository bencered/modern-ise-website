export type CategoryId = "r1_only" | "r2_only" | "r1_r2" | "all_r1_r2" | "r3" | "r4" | "r5" | "all";

export interface CategoryConfig {
  id: CategoryId;
  label: string;
  shortLabel: string;
  description: string;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: "r1_only",
    label: "R1 Only",
    shortLabel: "R1",
    description: "Companies with only R1 positions",
  },
  {
    id: "r2_only",
    label: "R2 Only",
    shortLabel: "R2",
    description: "Companies with only R2 positions",
  },
  {
    id: "r1_r2",
    label: "R1+R2",
    shortLabel: "R1+R2",
    description: "Companies with both R1 and R2 positions",
  },
  {
    id: "all_r1_r2",
    label: "All R1/R2",
    shortLabel: "All R1/R2",
    description: "All companies with any R1 or R2",
  },
  {
    id: "r3",
    label: "R3",
    shortLabel: "R3",
    description: "Companies with R3 positions",
  },
  {
    id: "r4",
    label: "R4",
    shortLabel: "R4",
    description: "Companies with R4 positions",
  },
  {
    id: "r5",
    label: "R5",
    shortLabel: "R5",
    description: "Companies with R5 positions",
  },
  {
    id: "all",
    label: "All",
    shortLabel: "All",
    description: "All companies",
  },
];

export function getCategoryById(id: CategoryId): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

interface CompanyResidencyInfo {
  hasR1: boolean;
  hasR2: boolean;
  hasR1PlusR2: boolean;
  hasR3: boolean;
  hasR4: boolean;
  hasR5: boolean;
}

function parseResidencyTypes(residencyTypes: string[]): CompanyResidencyInfo {
  return {
    hasR1: residencyTypes.some((t) => t === "R1"),
    hasR2: residencyTypes.some((t) => t === "R2"),
    hasR1PlusR2: residencyTypes.some((t) => t === "R1+R2"),
    hasR3: residencyTypes.some((t) => t === "R3"),
    hasR4: residencyTypes.some((t) => t === "R4"),
    hasR5: residencyTypes.some((t) => t === "R5"),
  };
}

/**
 * Determine which categories a company belongs to based on its residency types.
 */
export function classifyCompany(residencyTypes: string[]): CategoryId[] {
  const info = parseResidencyTypes(residencyTypes);
  const categories: CategoryId[] = [];

  // A company has R1-type if it has R1 or R1+R2
  const hasR1Type = info.hasR1 || info.hasR1PlusR2;
  // A company has R2-type if it has R2 or R1+R2
  const hasR2Type = info.hasR2 || info.hasR1PlusR2;

  // R1 Only: has R1-type but NOT R2-type
  if (hasR1Type && !hasR2Type) {
    categories.push("r1_only");
  }

  // R2 Only: has R2-type but NOT R1-type
  if (hasR2Type && !hasR1Type) {
    categories.push("r2_only");
  }

  // R1+R2: has BOTH R1-type AND R2-type
  if (hasR1Type && hasR2Type) {
    categories.push("r1_r2");
  }

  // All R1/R2: has any R1 or R2
  if (hasR1Type || hasR2Type) {
    categories.push("all_r1_r2");
  }

  // R3: has R3
  if (info.hasR3) {
    categories.push("r3");
  }

  // R4: has R4
  if (info.hasR4) {
    categories.push("r4");
  }

  // R5: has R5
  if (info.hasR5) {
    categories.push("r5");
  }

  // All: every company
  categories.push("all");

  return categories;
}

/**
 * Filter companies to only those that belong to a specific category.
 */
export function filterCompaniesByCategory<
  T extends { residencyTypes: string[] }
>(companies: T[], category: CategoryId): T[] {
  return companies.filter((company) =>
    classifyCompany(company.residencyTypes).includes(category)
  );
}
