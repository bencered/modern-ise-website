"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResidencyCard, ResidencyCardSkeleton } from "./residency-card";
import { ResidencySidebar } from "./residency-sidebar";
import type { Id } from "../../../convex/_generated/dataModel";

const RESIDENCY_TYPES = [
  { value: "all", label: "All" },
  { value: "R1", label: "R1" },
  { value: "R1+R2", label: "R1+R2" },
  { value: "R2", label: "R2" },
  { value: "R3", label: "R3" },
  { value: "R4", label: "R4" },
];

const TYPE_ORDER = ["R1", "R1+R2", "R2", "R3", "R4"];

interface Company {
  _id: Id<"companies">;
  name: string;
  slug: string;
  imageUrl?: string;
  website?: string;
}

interface Residency {
  _id: Id<"residencies">;
  name: string;
  residencyType: string;
  residencyTitle: string;
  jobTitle: string;
  description?: string;
  emailAddress?: string;
  monthlySalary?: string;
  accommodationSupport?: string;
  company: Company | null;
  createdAt: string;
}

export function ResidencyList() {
  const [selectedType, setSelectedType] = useState("all");
  const [selectedResidencyId, setSelectedResidencyId] = useState<Id<"residencies"> | null>(null);

  // Fetch all residencies once
  const allResidencies = useQuery(api.residencies.list);

  // Filter locally
  const filteredResidencies = useMemo(() => {
    if (!allResidencies) return null;
    if (selectedType === "all") return allResidencies;
    return allResidencies.filter((r) => r.residencyType === selectedType);
  }, [allResidencies, selectedType]);

  // Group by type for separators when showing all
  const groupedResidencies = useMemo(() => {
    if (!filteredResidencies || selectedType !== "all") return null;

    const groups: Record<string, Residency[]> = {};
    for (const residency of filteredResidencies) {
      if (!groups[residency.residencyType]) {
        groups[residency.residencyType] = [];
      }
      groups[residency.residencyType].push(residency as Residency);
    }

    // Sort by TYPE_ORDER
    return TYPE_ORDER
      .filter((type) => groups[type]?.length > 0)
      .map((type) => ({ type, residencies: groups[type] }));
  }, [filteredResidencies, selectedType]);

  const selectedResidency = useMemo(() => {
    if (!selectedResidencyId || !allResidencies) return null;
    return allResidencies.find((r) => r._id === selectedResidencyId) as Residency | undefined;
  }, [selectedResidencyId, allResidencies]);

  const typeCounts = useMemo(() => {
    if (!allResidencies) return {};
    const counts: Record<string, number> = { all: allResidencies.length };
    for (const r of allResidencies) {
      counts[r.residencyType] = (counts[r.residencyType] || 0) + 1;
    }
    return counts;
  }, [allResidencies]);

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        {/* Tabs - always visible, not affected by loading */}
        <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
          <TabsList className="mb-6 flex w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {RESIDENCY_TYPES.map((type) => (
              <TabsTrigger
                key={type.value}
                value={type.value}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-all data-[state=active]:border-green-500 data-[state=active]:bg-green-500/10 data-[state=active]:text-green-500"
              >
                {type.label}
                {typeCounts[type.value] !== undefined && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {typeCounts[type.value]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Content - shows skeleton or data */}
        {!filteredResidencies ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ResidencyCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredResidencies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg text-muted-foreground">No positions found</p>
            <p className="text-sm text-muted-foreground">
              Check back later for new opportunities
            </p>
          </div>
        ) : selectedType === "all" && groupedResidencies ? (
          // Grouped view with separators
          <div className="space-y-8">
            {groupedResidencies.map(({ type, residencies }) => (
              <div key={type}>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-muted-foreground">
                    Residency {type}
                  </h2>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-sm text-muted-foreground">
                    {residencies.length} position{residencies.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {residencies.map((residency) => (
                    <ResidencyCard
                      key={residency._id}
                      residency={residency}
                      isSelected={selectedResidencyId === residency._id}
                      onClick={() => setSelectedResidencyId(residency._id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Flat view for filtered
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResidencies.map((residency) => (
              <ResidencyCard
                key={residency._id}
                residency={residency as Residency}
                isSelected={selectedResidencyId === residency._id}
                onClick={() => setSelectedResidencyId(residency._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Persistent Sidebar */}
      <ResidencySidebar
        residency={selectedResidency || null}
        onClose={() => setSelectedResidencyId(null)}
      />
    </div>
  );
}
