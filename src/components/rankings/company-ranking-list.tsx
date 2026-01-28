"use client";

import { useState, useMemo } from "react";
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
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Image from "next/image";
import { Building2, RotateCcw, GripVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompanyRankings } from "@/hooks/useCompanyRankings";
import {
  CATEGORIES,
  type CategoryId,
  classifyCompany,
} from "@/lib/company-categories";

interface Company {
  _id: Id<"companies">;
  name: string;
  slug: string;
  imageUrl?: string;
  residencyTypes: string[];
}

function cleanName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/^R\d\+?\d?\s*[\|\s_-]+\s*/i, "")
    .replace(/\s*[\|\s_-]+R?\d+$/i, "")
    .trim();
}

// Company card for unranked pool (grid layout)
function CompanyCard({
  company,
  isDragging,
}: {
  company: Company;
  isDragging?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-lg bg-background border-2 border-border shadow-sm ${
        isDragging ? "shadow-lg ring-2 ring-green-500" : ""
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

// Ranked company card (horizontal layout with rank number)
function RankedCompanyCard({
  company,
  rank,
  isDragging,
}: {
  company: Company;
  rank: number;
  isDragging?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg bg-background border-2 border-border shadow-sm ${
        isDragging ? "shadow-lg ring-2 ring-green-500" : ""
      }`}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full border border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 font-bold text-sm shrink-0">
        {rank}
      </div>
      {company.imageUrl ? (
        <Image
          src={company.imageUrl}
          alt={cleanName(company.name)}
          width={40}
          height={40}
          className="w-10 h-10 rounded-md object-cover shrink-0"
          draggable={false}
        />
      ) : (
        <div className="flex w-10 h-10 items-center justify-center rounded-md bg-muted shrink-0">
          <Building2 className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <span className="font-medium truncate flex-1">
        {cleanName(company.name)}
      </span>
      <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
    </div>
  );
}

// Draggable wrapper for unranked pool
function DraggableCompanyCard({ company }: { company: Company }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id: company._id,
    animateLayoutChanges: () => false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing touch-none"
    >
      <CompanyCard company={company} />
    </div>
  );
}

// Sortable wrapper for ranked list
function SortableRankedCard({
  company,
  rank,
}: {
  company: Company;
  rank: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id: company._id,
    animateLayoutChanges: () => false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing touch-none"
    >
      <RankedCompanyCard company={company} rank={rank} />
    </div>
  );
}

// Droppable ranked list container
function DroppableRankedList({
  companies,
  companyMap,
}: {
  companies: Id<"companies">[];
  companyMap: Map<string, Company>;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "ranked-list",
    data: { type: "ranked" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] p-4 rounded-lg border-2 ${
        isOver
          ? "border-green-500 bg-green-500/10 ring-2 ring-offset-2 ring-green-500"
          : "border-border bg-muted/20"
      }`}
    >
      <SortableContext
        items={companies}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {companies.map((id, index) => {
            const company = companyMap.get(id);
            if (!company) return null;
            return (
              <SortableRankedCard
                key={id}
                company={company}
                rank={index + 1}
              />
            );
          })}
        </div>
      </SortableContext>
      {companies.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">
          Drag companies here to rank them
        </p>
      )}
    </div>
  );
}

// Droppable unranked pool
function DroppableUnrankedPool({ companies }: { companies: Company[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "unranked-pool",
    data: { type: "unranked" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] p-4 rounded-lg border-2 border-dashed ${
        isOver
          ? "border-green-500 bg-green-500/10 ring-2 ring-offset-2 ring-green-500"
          : "border-border bg-muted/20"
      }`}
    >
      <SortableContext
        items={companies.map((c) => c._id)}
        strategy={rectSortingStrategy}
      >
        <div className="flex flex-wrap gap-2">
          {companies.map((company) => (
            <DraggableCompanyCard key={company._id} company={company} />
          ))}
        </div>
      </SortableContext>
      {companies.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-4">
          All companies have been ranked!
        </p>
      )}
    </div>
  );
}

// Category tabs
function CategoryTabs({
  activeCategory,
  onCategoryChange,
}: {
  activeCategory: CategoryId;
  onCategoryChange: (category: CategoryId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === cat.id
              ? "bg-green-500 text-white"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
          title={cat.description}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

const CATEGORY_KEY = "rankings_category";

function getStoredCategory(): CategoryId {
  if (typeof window === "undefined") return "all";
  const stored = localStorage.getItem(CATEGORY_KEY);
  if (stored && CATEGORIES.some((c) => c.id === stored)) {
    return stored as CategoryId;
  }
  return "all";
}

export function CompanyRankingList() {
  const companies = useQuery(api.residencies.listCompaniesForRankings);
  const [activeCategory, setActiveCategory] = useState<CategoryId>(() => getStoredCategory());
  const [activeId, setActiveId] = useState<string | null>(null);

  // Persist category to localStorage
  function handleCategoryChange(category: CategoryId) {
    setActiveCategory(category);
    localStorage.setItem(CATEGORY_KEY, category);
  }

  const { rankings, saveRankings, clearRankings, isLoading } =
    useCompanyRankings(activeCategory);

  // Map companies to the expected format
  const allCompanies = useMemo(() => {
    if (!companies) return [];

    return companies.map((c) => ({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      imageUrl: c.imageUrl ?? undefined,
      residencyTypes: c.residencyTypes,
    }));
  }, [companies]);

  // Company map for quick lookups
  const companyMap = useMemo(() => {
    const map = new Map<string, Company>();
    for (const company of allCompanies) {
      map.set(company._id, company);
    }
    return map;
  }, [allCompanies]);

  // Filter companies for current category
  const categoryCompanies = useMemo(() => {
    return allCompanies.filter((company) =>
      classifyCompany(company.residencyTypes).includes(activeCategory)
    );
  }, [allCompanies, activeCategory]);

  // Split into ranked and unranked
  const rankedSet = useMemo(() => new Set(rankings), [rankings]);

  const unrankedCompanies = useMemo(() => {
    return categoryCompanies.filter((c) => !rankedSet.has(c._id));
  }, [categoryCompanies, rankedSet]);

  // Filter rankings to only include companies in current category
  const validRankings = useMemo(() => {
    const categoryIds = new Set(categoryCompanies.map((c) => c._id));
    return rankings.filter((id) => categoryIds.has(id));
  }, [rankings, categoryCompanies]);

  // All sortable IDs
  const allIds = useMemo(
    () => [...validRankings, ...unrankedCompanies.map((c) => c._id)],
    [validRankings, unrankedCompanies]
  );

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

  const activeCompany = activeId ? companyMap.get(activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedId = active.id as Id<"companies">;
    const overId = over.id as string;

    const isActiveRanked = rankedSet.has(draggedId);
    const isOverRankedList = overId === "ranked-list";
    const isOverUnrankedPool = overId === "unranked-pool";
    const isOverRankedItem = rankedSet.has(overId as Id<"companies">);
    const isOverUnrankedItem = !isOverRankedItem && !isOverRankedList && !isOverUnrankedPool && companyMap.has(overId);

    // Case 1: Reordering within ranked list
    if (isActiveRanked && isOverRankedItem) {
      const activeIndex = validRankings.indexOf(draggedId);
      const overIndex = validRankings.indexOf(overId as Id<"companies">);
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        const newRankings = arrayMove(validRankings, activeIndex, overIndex);
        saveRankings(newRankings);
      }
      return;
    }

    // Case 2: Moving from unranked to ranked (drop on list or ranked item)
    if (!isActiveRanked && (isOverRankedList || isOverRankedItem)) {
      if (!validRankings.includes(draggedId)) {
        if (isOverRankedItem) {
          // Insert at specific position
          const overIndex = validRankings.indexOf(overId as Id<"companies">);
          const newRankings = [...validRankings];
          newRankings.splice(overIndex, 0, draggedId);
          saveRankings(newRankings);
        } else {
          // Append to end
          const newRankings = [...validRankings, draggedId];
          saveRankings(newRankings);
        }
      }
      return;
    }

    // Case 3: Moving from ranked to unranked (drop on pool or unranked item)
    if (isActiveRanked && (isOverUnrankedPool || isOverUnrankedItem)) {
      const newRankings = validRankings.filter((id) => id !== draggedId);
      saveRankings(newRankings);
      return;
    }
  }

  function handleReset() {
    clearRankings();
  }

  if (!companies || isLoading) {
    return (
      <div className="space-y-6">
        {/* Category tabs skeleton */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-20 rounded-lg" />
          ))}
        </div>

        {/* Controls skeleton */}
        <Skeleton className="h-10 w-36 rounded-lg" />

        {/* Two column layout skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ranked list skeleton */}
          <div>
            <Skeleton className="h-6 w-40 mb-3" />
            <div className="min-h-[200px] p-4 rounded-lg border-2 border-border bg-muted/20 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-background border-2 border-border">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="w-10 h-10 rounded-md" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="w-5 h-5" />
                </div>
              ))}
            </div>
          </div>

          {/* Unranked pool skeleton */}
          <div>
            <Skeleton className="h-6 w-32 mb-3" />
            <div className="min-h-[100px] p-4 rounded-lg border-2 border-dashed border-border bg-muted/20">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="w-16 h-16 md:w-20 md:h-20 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="flex justify-center">
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category tabs */}
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleReset}
          disabled={validRankings.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Rankings
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ranked list */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Your Rankings ({validRankings.length})
              </h3>
              <DroppableRankedList
                companies={validRankings}
                companyMap={companyMap}
              />
            </div>

            {/* Unranked pool */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
                Unranked ({unrankedCompanies.length})
              </h3>
              <DroppableUnrankedPool companies={unrankedCompanies} />
            </div>
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeCompany &&
            (rankedSet.has(activeCompany._id) ? (
              <RankedCompanyCard
                company={activeCompany}
                rank={validRankings.indexOf(activeCompany._id) + 1}
                isDragging
              />
            ) : (
              <CompanyCard company={activeCompany} isDragging />
            ))}
        </DragOverlay>
      </DndContext>

      {/* Stats */}
      <div className="text-center text-sm text-muted-foreground">
        {validRankings.length} of {categoryCompanies.length} companies ranked in{" "}
        {CATEGORIES.find((c) => c.id === activeCategory)?.label}
      </div>
    </div>
  );
}
