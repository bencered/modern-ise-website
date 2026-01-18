"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Image from "next/image";
import { Building2, RotateCcw, Sparkles } from "lucide-react";

const TIERS_KEY = "company_tiers";

interface Company {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
}

type TierId = "S" | "A" | "B" | "C" | "D" | "F" | "unranked";

interface TierConfig {
  id: TierId;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const TIERS: TierConfig[] = [
  { id: "S", label: "S", color: "text-red-900", bgColor: "bg-red-400", borderColor: "border-red-500" },
  { id: "A", label: "A", color: "text-orange-900", bgColor: "bg-orange-400", borderColor: "border-orange-500" },
  { id: "B", label: "B", color: "text-yellow-900", bgColor: "bg-yellow-400", borderColor: "border-yellow-500" },
  { id: "C", label: "C", color: "text-green-900", bgColor: "bg-green-400", borderColor: "border-green-500" },
  { id: "D", label: "D", color: "text-blue-900", bgColor: "bg-blue-400", borderColor: "border-blue-500" },
  { id: "F", label: "F", color: "text-purple-900", bgColor: "bg-purple-400", borderColor: "border-purple-500" },
];

function cleanName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/^R\d\+?\d?\s*[\|\s_-]+\s*/i, "")
    .replace(/\s*[\|\s_-]+R?\d+$/i, "")
    .trim();
}

// Load tier assignments from localStorage
function loadTiers(): Record<string, TierId> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(TIERS_KEY) || "{}");
  } catch {
    return {};
  }
}

// Save tier assignments to localStorage
function saveTiers(tiers: Record<string, TierId>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TIERS_KEY, JSON.stringify(tiers));
}

// Draggable company card
function CompanyCard({ company, isDragging }: { company: Company; isDragging?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-lg bg-background border-2 border-border shadow-sm transition-transform ${
        isDragging ? "scale-105 shadow-lg ring-2 ring-green-500" : "hover:scale-105"
      }`}
    >
      {company.imageUrl ? (
        <Image
          src={company.imageUrl}
          alt={cleanName(company.name)}
          width={48}
          height={48}
          className="w-10 h-10 md:w-12 md:h-12 rounded-md object-cover"
          draggable={false}
        />
      ) : (
        <div className="flex w-10 h-10 md:w-12 md:h-12 items-center justify-center rounded-md bg-muted">
          <Building2 className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
        </div>
      )}
      <span className="mt-1 text-[10px] md:text-xs text-center font-medium truncate w-full px-1">
        {cleanName(company.name).split(" ")[0]}
      </span>
    </div>
  );
}

// Draggable wrapper for company cards
function DraggableCompanyCard({ company }: { company: Company }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: company._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
      <CompanyCard company={company} />
    </div>
  );
}

// Droppable tier row
function DroppableTierRow({
  tier,
  companies,
}: {
  tier: TierConfig;
  companies: Company[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `tier-${tier.id}`,
    data: { type: "tier", tierId: tier.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex border-2 ${tier.borderColor} rounded-lg overflow-hidden transition-all ${
        isOver ? "ring-2 ring-offset-2 ring-green-500 scale-[1.01]" : ""
      }`}
    >
      {/* Tier label */}
      <div className={`${tier.bgColor} ${tier.color} w-16 md:w-20 flex items-center justify-center font-bold text-2xl md:text-3xl shrink-0`}>
        {tier.label}
      </div>

      {/* Companies in this tier */}
      <div className="flex-1 min-h-[80px] md:min-h-[96px] bg-muted/30 p-2">
        <div className="flex flex-wrap gap-2 min-h-full">
          {companies.map((company) => (
            <DraggableCompanyCard key={company._id} company={company} />
          ))}
          {companies.length === 0 && (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground/50 text-sm">
              Drop here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Droppable unranked pool
function DroppableUnrankedPool({ companies }: { companies: Company[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "tier-unranked",
    data: { type: "tier", tierId: "unranked" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] p-4 rounded-lg border-2 border-dashed transition-all ${
        isOver
          ? "border-green-500 bg-green-500/10 ring-2 ring-offset-2 ring-green-500"
          : "border-border bg-muted/20"
      }`}
    >
      <div className="flex flex-wrap gap-2">
        {companies.map((company) => (
          <DraggableCompanyCard key={company._id} company={company} />
        ))}
      </div>
      {companies.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-4">
          All companies have been ranked!
        </p>
      )}
    </div>
  );
}

export function TierList() {
  const residencies = useQuery(api.residencies.list);
  const [tierAssignments, setTierAssignments] = useState<Record<string, TierId>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Extract unique companies from residencies
  const companies = useMemo(() => {
    if (!residencies) return [];
    const seen = new Set<string>();
    const result: Company[] = [];

    for (const r of residencies) {
      if (r.company && !seen.has(r.company._id)) {
        seen.add(r.company._id);
        result.push({
          _id: r.company._id,
          name: r.company.name,
          slug: r.company.slug,
          imageUrl: r.company.imageUrl ?? undefined,
        });
      }
    }

    return result.sort((a, b) => cleanName(a.name).localeCompare(cleanName(b.name)));
  }, [residencies]);

  // Load from localStorage on mount
  useEffect(() => {
    setTierAssignments(loadTiers());
    setLoaded(true);
  }, []);

  // Save to localStorage when assignments change
  useEffect(() => {
    if (loaded) {
      saveTiers(tierAssignments);
    }
  }, [tierAssignments, loaded]);

  // Group companies by tier
  const companiesByTier = useMemo(() => {
    const groups: Record<TierId, Company[]> = {
      S: [],
      A: [],
      B: [],
      C: [],
      D: [],
      F: [],
      unranked: [],
    };

    for (const company of companies) {
      const tier = tierAssignments[company._id] || "unranked";
      groups[tier].push(company);
    }

    return groups;
  }, [companies, tierAssignments]);

  // All company IDs for the sortable context
  const allCompanyIds = useMemo(() => companies.map((c) => c._id), [companies]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeCompany = activeId ? companies.find((c) => c._id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dropping onto a tier row
    if (overId.startsWith("tier-")) {
      const tierId = overId.replace("tier-", "") as TierId;
      const currentTier = tierAssignments[activeId] || "unranked";
      if (currentTier !== tierId) {
        setTierAssignments((prev) => ({
          ...prev,
          [activeId]: tierId,
        }));
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Final assignment on drop
    if (overId.startsWith("tier-")) {
      const tierId = overId.replace("tier-", "") as TierId;
      setTierAssignments((prev) => ({
        ...prev,
        [activeId]: tierId,
      }));
    }
  }

  function handleReset() {
    setTierAssignments({});
    localStorage.removeItem(TIERS_KEY);
  }

  function handleAutoTier() {
    // Fun feature: randomly assign unranked companies to tiers
    const unranked = companiesByTier.unranked;
    if (unranked.length === 0) return;

    const newAssignments = { ...tierAssignments };
    const tierIds: TierId[] = ["S", "A", "B", "C", "D", "F"];

    for (const company of unranked) {
      const randomTier = tierIds[Math.floor(Math.random() * tierIds.length)];
      newAssignments[company._id] = randomTier;
    }

    setTierAssignments(newAssignments);
  }

  if (!residencies) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={allCompanyIds} strategy={rectSortingStrategy}>
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              onClick={handleAutoTier}
              disabled={companiesByTier.unranked.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4" />
              Randomize Unranked
            </button>
          </div>

          {/* Tier rows */}
          <div className="space-y-2">
            {TIERS.map((tier) => (
              <DroppableTierRow
                key={tier.id}
                tier={tier}
                companies={companiesByTier[tier.id]}
              />
            ))}
          </div>

          {/* Unranked pool */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
              Unranked Companies ({companiesByTier.unranked.length})
            </h3>
            <DroppableUnrankedPool companies={companiesByTier.unranked} />
          </div>

          {/* Stats */}
          <div className="text-center text-sm text-muted-foreground">
            {Object.keys(tierAssignments).length} of {companies.length} companies ranked
          </div>
        </div>
      </SortableContext>

      {/* Drag overlay */}
      <DragOverlay>
        {activeCompany && <CompanyCard company={activeCompany} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
