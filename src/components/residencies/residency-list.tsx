"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ResidencyCard, ResidencyCardSkeleton } from "./residency-card";
import { ResidencySidebar, ResidencyDrawerContent } from "./residency-sidebar";
import type { Id } from "../../../convex/_generated/dataModel";
import { MapPin, ArrowUpDown, X, Star, Layers, LayoutGrid, Table, Building2 } from "lucide-react";
import Image from "next/image";

// Hook to detect mobile screen (below lg breakpoint)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

const RESIDENCY_TYPES = [
  { value: "all", label: "All" },
  { value: "R1", label: "R1" },
  { value: "R1+R2", label: "R1+R2" },
  { value: "R2", label: "R2" },
  { value: "R3", label: "R3" },
  { value: "R4", label: "R4" },
];

const TYPE_ORDER = ["R1", "R1+R2", "R2", "R3", "R4"];

const SORT_OPTIONS = [
  { value: "company", label: "Company Name" },
  { value: "latest", label: "Latest Added" },
  { value: "rating", label: "My Rating" },
  { value: "salary-high", label: "Salary (High to Low)" },
];

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
  location?: string;
  company: Company | null;
  createdAt: string;
}

// localStorage helpers for personal ratings
const RATINGS_KEY = "residency_ratings";
const PREFERENCES_KEY = "residency_preferences";

interface Preferences {
  viewMode: "cards" | "table";
  sortBy: string;
  aggregateByCompany: boolean;
  selectedType: string;
}

function getPersonalRatings(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(RATINGS_KEY) || "{}");
  } catch {
    return {};
  }
}

function getPreferences(): Partial<Preferences> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PREFERENCES_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePreferences(prefs: Partial<Preferences>) {
  if (typeof window === "undefined") return;
  const current = getPreferences();
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ ...current, ...prefs }));
}

// Parse salary string to number for sorting
function parseSalary(salary?: string): number {
  if (!salary) return 0;
  // Extract first number from salary string (handles "€2,500", "€2816 basic plus...", "Competitive", etc.)
  const match = salary.replace(/,/g, "").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

// Clean company name for display
function cleanName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/^R\d\+?\d?\s*[\|\s_-]+\s*/i, "")
    .replace(/\s*[\|\s_-]+R?\d+$/i, "")
    .trim();
}

// Table row component
interface TableRowProps {
  residency: Residency;
  isSelected: boolean;
  onClick: () => void;
  personalRating?: number;
  aggregateCount?: number;
}

function ResidencyTableRow({ residency, isSelected, onClick, personalRating, aggregateCount }: TableRowProps) {
  const rawName = residency.company?.name || residency.name.split("|")[1]?.trim() || residency.name;
  const companyName = cleanName(rawName);

  return (
    <tr
      data-residency-id={residency._id}
      onClick={onClick}
      className={`cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/50 ${
        isSelected ? "bg-green-500/10" : ""
      }`}
    >
      {aggregateCount !== undefined && (
        <td className="w-12 px-2 py-3 text-center">
          <span className="rounded bg-blue-500 px-1.5 py-0.5 text-xs font-medium text-white">
            {aggregateCount}
          </span>
        </td>
      )}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {residency.company?.imageUrl ? (
            <Image
              src={residency.company.imageUrl}
              alt={companyName}
              width={32}
              height={32}
              className="h-8 w-8 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <span className="font-medium truncate">{companyName}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[200px]">
        {residency.residencyTitle}
      </td>
      <td className="px-4 py-3">
        <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
          {residency.residencyType}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[200px]">
        {residency.jobTitle}
      </td>
      <td className="px-4 py-3 text-sm">
        {residency.monthlySalary ? (
          <span className="font-mono text-xs">
            {(() => {
              const salary = residency.monthlySalary.split(/\n/)[0];
              return salary.length > 65 ? salary.slice(0, 65) + "…" : salary;
            })()}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[120px]">
        {residency.location || "-"}
      </td>
      <td className="px-4 py-3">
        {personalRating ? (
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i <= personalRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </td>
    </tr>
  );
}

// Table component
interface ResidencyTableProps {
  items: { residency: Residency; count: number; allIds: string[] }[];
  selectedResidencyId: Id<"residencies"> | null;
  onSelect: (id: Id<"residencies">) => void;
  personalRatings: Record<string, number>;
  showAggregateCount: boolean;
}

function ResidencyTable({ items, selectedResidencyId, onSelect, personalRatings, showAggregateCount }: ResidencyTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/50 bg-card">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-left text-sm font-medium text-muted-foreground">
            {showAggregateCount && <th className="w-12 px-2 py-3"></th>}
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Job Title</th>
            <th className="px-4 py-3">Salary</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Rating</th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ residency, count, allIds }) => (
            <ResidencyTableRow
              key={allIds.join("-")}
              residency={residency}
              isSelected={allIds.includes(selectedResidencyId as string)}
              onClick={() => onSelect(residency._id)}
              personalRating={personalRatings[residency._id]}
              aggregateCount={showAggregateCount ? count : undefined}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ResidencyList() {
  const [selectedType, setSelectedType] = useState("all");
  const [selectedResidencyId, setSelectedResidencyId] = useState<Id<"residencies"> | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("company");
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [personalRatings, setPersonalRatings] = useState<Record<string, number>>({});
  const [aggregateByCompany, setAggregateByCompany] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const isMobile = useIsMobile();

  // Load personal ratings and preferences from localStorage
  useEffect(() => {
    setPersonalRatings(getPersonalRatings());
    const prefs = getPreferences();
    if (prefs.viewMode) setViewMode(prefs.viewMode);
    if (prefs.sortBy) setSortBy(prefs.sortBy);
    if (prefs.aggregateByCompany !== undefined) setAggregateByCompany(prefs.aggregateByCompany);
    if (prefs.selectedType) setSelectedType(prefs.selectedType);
    setPrefsLoaded(true);
  }, []);

  // Save preferences when they change
  useEffect(() => {
    if (!prefsLoaded) return;
    savePreferences({ viewMode, sortBy, aggregateByCompany, selectedType });
  }, [viewMode, sortBy, aggregateByCompany, selectedType, prefsLoaded]);

  // Callback to refresh ratings when user rates something
  const refreshRatings = useCallback(() => {
    setPersonalRatings(getPersonalRatings());
  }, []);

  // Fetch all residencies once
  const allResidencies = useQuery(api.residencies.list);

  // Get flat list of residency IDs for keyboard navigation
  const navigationIds = useMemo((): Id<"residencies">[] => {
    if (!allResidencies) return [];

    let filtered = [...allResidencies];

    // Apply type filter
    if (selectedType !== "all") {
      filtered = filtered.filter((r) => r.residencyType === selectedType);
    }

    // Apply location filter
    if (selectedLocations.length > 0) {
      filtered = filtered.filter((r) => r.location && selectedLocations.includes(r.location));
    }

    // Sort function
    const sortFn = (a: typeof allResidencies[0], b: typeof allResidencies[0]) => {
      if (sortBy === "company") {
        const nameA = a.company?.name || a.name || "";
        const nameB = b.company?.name || b.name || "";
        return nameA.localeCompare(nameB);
      } else if (sortBy === "latest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "rating") {
        const ratingA = personalRatings[a._id] || 0;
        const ratingB = personalRatings[b._id] || 0;
        return ratingB - ratingA;
      } else if (sortBy === "salary-high") {
        return parseSalary(b.monthlySalary) - parseSalary(a.monthlySalary);
      }
      return 0;
    };

    // When showing all types, group by type first (matching visual order)
    if (selectedType === "all") {
      const result: Id<"residencies">[] = [];
      for (const type of TYPE_ORDER) {
        const typeItems = filtered.filter((r) => r.residencyType === type);
        typeItems.sort(sortFn);
        result.push(...typeItems.map((r) => r._id));
      }
      return result;
    }

    // For single type, just sort
    filtered.sort(sortFn);
    return filtered.map((r) => r._id);
  }, [allResidencies, selectedType, selectedLocations, sortBy, personalRatings]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "Escape") {
        setSelectedResidencyId(null);
        return;
      }

      let newId: Id<"residencies"> | null = null;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        if (navigationIds.length === 0) return;

        if (!selectedResidencyId) {
          newId = navigationIds[0];
        } else {
          const currentIndex = navigationIds.indexOf(selectedResidencyId);
          if (currentIndex < navigationIds.length - 1) {
            newId = navigationIds[currentIndex + 1];
          }
        }
      }

      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        if (navigationIds.length === 0) return;

        if (!selectedResidencyId) {
          newId = navigationIds[navigationIds.length - 1];
        } else {
          const currentIndex = navigationIds.indexOf(selectedResidencyId);
          if (currentIndex > 0) {
            newId = navigationIds[currentIndex - 1];
          }
        }
      }

      if (newId) {
        setSelectedResidencyId(newId);
        // Scroll the element into view
        setTimeout(() => {
          const element = document.querySelector(`[data-residency-id="${newId}"]`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }, 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigationIds, selectedResidencyId]);

  // Get unique locations from residencies
  const availableLocations = useMemo(() => {
    if (!allResidencies) return [];
    const locations = new Set<string>();
    for (const r of allResidencies) {
      if (r.location) locations.add(r.location);
    }
    return Array.from(locations).sort();
  }, [allResidencies]);

  // Filter and sort
  const filteredResidencies = useMemo(() => {
    if (!allResidencies) return null;

    let result = allResidencies;

    // Filter by type
    if (selectedType !== "all") {
      result = result.filter((r) => r.residencyType === selectedType);
    }

    // Filter by location
    if (selectedLocations.length > 0) {
      result = result.filter((r) => r.location && selectedLocations.includes(r.location));
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === "company") {
        const nameA = a.company?.name || a.name || "";
        const nameB = b.company?.name || b.name || "";
        return nameA.localeCompare(nameB);
      } else if (sortBy === "latest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "rating") {
        const ratingA = personalRatings[a._id] || 0;
        const ratingB = personalRatings[b._id] || 0;
        return ratingB - ratingA; // High to low
      } else if (sortBy === "salary-high") {
        return parseSalary(b.monthlySalary) - parseSalary(a.monthlySalary);
      }
      return 0;
    });

    return result;
  }, [allResidencies, selectedType, selectedLocations, sortBy, personalRatings]);

  // Helper to aggregate residencies by company within a list
  const aggregateByCompanyFn = useCallback((residencies: Residency[]) => {
    const groups: Record<string, { residency: Residency; count: number; allIds: string[] }> = {};

    for (const residency of residencies) {
      const companyName = residency.company?.name || residency.name.split("|")[1]?.trim() || residency.name;
      const key = companyName;

      if (!groups[key]) {
        groups[key] = {
          residency: residency,
          count: 1,
          allIds: [residency._id],
        };
      } else {
        groups[key].count++;
        groups[key].allIds.push(residency._id);
      }
    }

    return Object.values(groups);
  }, []);

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

  function toggleLocation(location: string) {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        {/* Filters */}
        <div className="flex flex-col gap-3 pb-4">
          {/* Tabs */}
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
              {RESIDENCY_TYPES.map((type) => (
                <TabsTrigger
                  key={type.value}
                  value={type.value}
                  className="shrink-0 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-all data-[state=active]:border-green-500 data-[state=active]:bg-green-950 data-[state=active]:text-green-500"
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

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Location filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowLocationFilter(!showLocationFilter);
                  setShowSortOptions(false);
                }}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${selectedLocations.length > 0
                    ? "border-green-500 bg-green-500/10 text-green-500"
                    : "border-border bg-background hover:bg-muted"
                  }`}
              >
                <MapPin className="h-4 w-4" />
                Location
                {selectedLocations.length > 0 && (
                  <span className="rounded-full bg-green-500 px-1.5 text-xs text-white">
                    {selectedLocations.length}
                  </span>
                )}
              </button>

              {showLocationFilter && (
                <div className="absolute left-0 top-full mt-2 z-30 w-64 rounded-lg border bg-background p-2 shadow-lg">
                  <div className="mb-2 flex items-center justify-between px-2">
                    <span className="text-sm font-medium">Filter by location</span>
                    {selectedLocations.length > 0 && (
                      <button
                        onClick={() => setSelectedLocations([])}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {availableLocations.length === 0 ? (
                      <p className="px-2 py-3 text-sm text-muted-foreground">
                        No locations set yet
                      </p>
                    ) : (
                      availableLocations.map((location) => (
                        <label
                          key={location}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted"
                        >
                          <input
                            type="checkbox"
                            checked={selectedLocations.includes(location)}
                            onChange={() => toggleLocation(location)}
                            className="h-4 w-4 rounded border-border"
                          />
                          <span className="text-sm">{location}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sort options */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSortOptions(!showSortOptions);
                  setShowLocationFilter(false);
                }}
                className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
              >
                <ArrowUpDown className="h-4 w-4" />
                Sort: {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
              </button>

              {showSortOptions && (
                <div className="absolute left-0 top-full mt-2 z-30 w-48 rounded-lg border bg-background p-1 shadow-lg">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortOptions(false);
                      }}
                      className={`w-full rounded px-3 py-2 text-left text-sm hover:bg-muted ${sortBy === option.value ? "bg-muted font-medium" : ""
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Aggregate toggle */}
            <button
              onClick={() => setAggregateByCompany(!aggregateByCompany)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                aggregateByCompany
                  ? "border-blue-500 bg-blue-500/10 text-blue-500"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              <Layers className="h-4 w-4" />
              Group by Company
            </button>

            {/* View toggle */}
            <div className="flex items-center rounded-full border border-border bg-background p-0.5">
              <button
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors ${
                  viewMode === "cards"
                    ? "bg-muted font-medium"
                    : "hover:bg-muted/50"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Cards
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors ${
                  viewMode === "table"
                    ? "bg-muted font-medium"
                    : "hover:bg-muted/50"
                }`}
              >
                <Table className="h-4 w-4" />
                Table
              </button>
            </div>

            {/* Active location filters */}
            {selectedLocations.map((location) => (
              <button
                key={location}
                onClick={() => toggleLocation(location)}
                className="flex items-center gap-1 rounded-full border border-green-500 bg-green-500/10 px-3 py-1.5 text-sm text-green-500"
              >
                {location}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>

        {/* Click outside to close dropdowns */}
        {(showLocationFilter || showSortOptions) && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setShowLocationFilter(false);
              setShowSortOptions(false);
            }}
          />
        )}

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
              {selectedLocations.length > 0
                ? "Try adjusting your location filters"
                : "Check back later for new opportunities"}
            </p>
          </div>
        ) : viewMode === "table" ? (
          // Table view
          (() => {
            if (selectedType === "all" && groupedResidencies) {
              return (
                <div className="space-y-8">
                  {groupedResidencies.map(({ type, residencies }) => {
                    const displayItems = aggregateByCompany
                      ? aggregateByCompanyFn(residencies)
                      : residencies.map((r) => ({ residency: r, count: 1, allIds: [r._id] }));

                    return (
                      <div key={type}>
                        <div className="mb-4 flex items-center gap-3">
                          <h2 className="text-lg font-semibold text-muted-foreground">
                            Residency {type}
                          </h2>
                          <div className="h-px flex-1 bg-border" />
                          <span className="text-sm text-muted-foreground">
                            {residencies.length} position{residencies.length !== 1 ? "s" : ""}
                            {aggregateByCompany && displayItems.length !== residencies.length && (
                              <> ({displayItems.length} {displayItems.length === 1 ? "company" : "companies"})</>
                            )}
                          </span>
                        </div>
                        <ResidencyTable
                          items={displayItems}
                          selectedResidencyId={selectedResidencyId}
                          onSelect={setSelectedResidencyId}
                          personalRatings={personalRatings}
                          showAggregateCount={aggregateByCompany}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            } else {
              const displayItems = aggregateByCompany
                ? aggregateByCompanyFn(filteredResidencies as Residency[])
                : (filteredResidencies as Residency[]).map((r) => ({ residency: r, count: 1, allIds: [r._id] }));

              return (
                <ResidencyTable
                  items={displayItems}
                  selectedResidencyId={selectedResidencyId}
                  onSelect={setSelectedResidencyId}
                  personalRatings={personalRatings}
                  showAggregateCount={aggregateByCompany}
                />
              );
            }
          })()
        ) : selectedType === "all" && groupedResidencies ? (
          // Grouped card view with separators
          <div className="space-y-8">
            {groupedResidencies.map(({ type, residencies }) => {
              const displayItems = aggregateByCompany
                ? aggregateByCompanyFn(residencies)
                : residencies.map((r) => ({ residency: r, count: 1, allIds: [r._id] }));

              return (
                <div key={type}>
                  <div className="mb-4 flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-muted-foreground">
                      Residency {type}
                    </h2>
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm text-muted-foreground">
                      {residencies.length} position{residencies.length !== 1 ? "s" : ""}
                      {aggregateByCompany && displayItems.length !== residencies.length && (
                        <> ({displayItems.length} {displayItems.length === 1 ? "company" : "companies"})</>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {displayItems.map(({ residency, count, allIds }) => (
                      <ResidencyCard
                        key={allIds.join("-")}
                        residency={residency}
                        isSelected={allIds.includes(selectedResidencyId as string)}
                        onClick={() => setSelectedResidencyId(residency._id)}
                        personalRating={personalRatings[residency._id]}
                        aggregateCount={aggregateByCompany ? count : undefined}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Flat card view for filtered (single type selected)
          (() => {
            const displayItems = aggregateByCompany
              ? aggregateByCompanyFn(filteredResidencies as Residency[])
              : (filteredResidencies as Residency[]).map((r) => ({ residency: r, count: 1, allIds: [r._id] }));

            return (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {displayItems.map(({ residency, count, allIds }) => (
                  <ResidencyCard
                    key={allIds.join("-")}
                    residency={residency}
                    isSelected={allIds.includes(selectedResidencyId as string)}
                    onClick={() => setSelectedResidencyId(residency._id)}
                    personalRating={personalRatings[residency._id]}
                    aggregateCount={aggregateByCompany ? count : undefined}
                  />
                ))}
              </div>
            );
          })()
        )}
      </div>

      {/* Desktop Sidebar */}
      <ResidencySidebar
        residency={selectedResidency || null}
        onClose={() => setSelectedResidencyId(null)}
        onRatingChange={refreshRatings}
      />

      {/* Mobile Drawer - only rendered on mobile */}
      {isMobile && (
        <Drawer
          open={!!selectedResidency}
          onOpenChange={(open) => !open && setSelectedResidencyId(null)}
        >
          <DrawerContent className="max-h-[85vh]">
            <VisuallyHidden>
              <DrawerTitle>Position Details</DrawerTitle>
            </VisuallyHidden>
            <ResidencyDrawerContent
              residency={selectedResidency || null}
              onClose={() => setSelectedResidencyId(null)}
              onRatingChange={refreshRatings}
            />
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
