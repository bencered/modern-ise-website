"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { CategoryId } from "@/lib/company-categories";

const RANKINGS_KEY = "company_rankings";

type RankingsData = Record<CategoryId, Id<"companies">[]>;

// localStorage helpers
function getLocalRankings(): RankingsData {
  if (typeof window === "undefined") return {} as RankingsData;
  try {
    return JSON.parse(localStorage.getItem(RANKINGS_KEY) || "{}");
  } catch {
    return {} as RankingsData;
  }
}

function setLocalRankings(rankings: RankingsData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RANKINGS_KEY, JSON.stringify(rankings));
}

function clearLocalRankings() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RANKINGS_KEY);
}

export function useCompanyRankings(category: CategoryId) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  // Server rankings from Convex
  const serverRankings = useQuery(
    api.companyRankings.getRankings,
    isAuthenticated ? { category } : "skip"
  );

  // Mutations
  const saveRankingsMutation = useMutation(api.companyRankings.saveRankings);
  const clearRankingsMutation = useMutation(api.companyRankings.clearRankings);
  const importRankingsMutation = useMutation(api.companyRankings.importRankings);

  // Local state for optimistic updates and localStorage fallback
  const [localRankings, setLocalRankingsState] = useState<RankingsData>(
    {} as RankingsData
  );
  const [optimisticRankings, setOptimisticRankings] = useState<
    Id<"companies">[] | null
  >(null);

  // Track if we've done the migration
  const hasMigrated = useRef(false);
  const wasAuthenticated = useRef(false);

  // Debounce timer for saves
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load localStorage on mount
  useEffect(() => {
    setLocalRankingsState(getLocalRankings());
  }, []);

  // Handle login migration: sync localStorage → server
  useEffect(() => {
    if (
      isAuthenticated &&
      !authLoading &&
      serverRankings !== undefined &&
      !hasMigrated.current &&
      !wasAuthenticated.current
    ) {
      const localData = getLocalRankings();
      const hasLocalData = Object.keys(localData).length > 0;

      if (hasLocalData) {
        // Migrate localStorage to server
        importRankingsMutation({ rankings: localData as Record<string, Id<"companies">[]> })
          .then(() => {
            clearLocalRankings();
            setLocalRankingsState({} as RankingsData);
          })
          .catch((error) => {
            console.error("Failed to migrate rankings:", error);
          });
      }

      hasMigrated.current = true;
    }

    if (!authLoading) {
      wasAuthenticated.current = isAuthenticated;
    }
  }, [isAuthenticated, authLoading, serverRankings, importRankingsMutation]);

  // Compute current rankings
  const rankings: Id<"companies">[] = (() => {
    if (isAuthenticated) {
      // Use optimistic update if available, otherwise server data
      if (optimisticRankings !== null) {
        return optimisticRankings;
      }
      return (serverRankings as Id<"companies">[]) || [];
    } else {
      return localRankings[category] || [];
    }
  })();

  // Save rankings with debounce
  const saveRankings = useCallback(
    (newRankings: Id<"companies">[]) => {
      // Clear any pending save
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      if (isAuthenticated) {
        // Optimistic update
        setOptimisticRankings(newRankings);

        // Debounced save to server
        saveTimerRef.current = setTimeout(() => {
          saveRankingsMutation({ category, rankings: newRankings })
            .then(() => {
              // Clear optimistic update on success
              setOptimisticRankings(null);
            })
            .catch((error) => {
              console.error("Failed to save rankings:", error);
              // Keep optimistic state on error - will retry on next change
            });
        }, 300);
      } else {
        // Use localStorage for unauthenticated users
        const newLocalRankings = { ...localRankings, [category]: newRankings };
        setLocalRankings(newLocalRankings);
        setLocalRankingsState(newLocalRankings);
      }
    },
    [isAuthenticated, category, localRankings, saveRankingsMutation]
  );

  // Clear rankings
  const clearRankings = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    if (isAuthenticated) {
      setOptimisticRankings([]);
      try {
        await clearRankingsMutation({ category });
        setOptimisticRankings(null);
      } catch (error) {
        console.error("Failed to clear rankings:", error);
        setOptimisticRankings(null);
      }
    } else {
      const newLocalRankings = { ...localRankings };
      delete newLocalRankings[category];
      setLocalRankings(newLocalRankings);
      setLocalRankingsState(newLocalRankings);
    }
  }, [isAuthenticated, category, localRankings, clearRankingsMutation]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    rankings,
    saveRankings,
    clearRankings,
    isLoading: authLoading || (isAuthenticated && serverRankings === undefined),
  };
}
