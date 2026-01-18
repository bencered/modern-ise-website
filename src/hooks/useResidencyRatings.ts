"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const RATINGS_KEY = "residency_ratings";

// localStorage helpers
function getLocalRatings(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(RATINGS_KEY) || "{}");
  } catch {
    return {};
  }
}

function setLocalRatings(ratings: Record<string, number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
}

function clearLocalRatings() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RATINGS_KEY);
}

export function useResidencyRatings() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  // Server ratings from Convex (null while loading, empty object if no ratings)
  const serverRatings = useQuery(
    api.userRatings.getMyRatings,
    isAuthenticated ? {} : "skip"
  );

  // Mutations
  const setRatingMutation = useMutation(api.userRatings.setRating);
  const clearRatingMutation = useMutation(api.userRatings.clearRating);
  const importRatingsMutation = useMutation(api.userRatings.importRatings);

  // Local state for optimistic updates and localStorage fallback
  const [localRatings, setLocalRatingsState] = useState<Record<string, number>>({});
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, number | null>>({});

  // Track if we've done the migration
  const hasMigrated = useRef(false);
  const wasAuthenticated = useRef(false);

  // Load localStorage on mount
  useEffect(() => {
    setLocalRatingsState(getLocalRatings());
  }, []);

  // Handle login migration: sync localStorage → server
  useEffect(() => {
    if (
      isAuthenticated &&
      !authLoading &&
      serverRatings !== undefined &&
      !hasMigrated.current &&
      !wasAuthenticated.current
    ) {
      const localData = getLocalRatings();
      const hasLocalData = Object.keys(localData).length > 0;

      if (hasLocalData) {
        // Migrate localStorage to server
        importRatingsMutation({ ratings: localData })
          .then(() => {
            // Clear localStorage after successful migration
            clearLocalRatings();
            setLocalRatingsState({});
          })
          .catch((error) => {
            console.error("Failed to migrate ratings:", error);
          });
      }

      hasMigrated.current = true;
    }

    // Track auth state changes
    if (!authLoading) {
      wasAuthenticated.current = isAuthenticated;
    }
  }, [isAuthenticated, authLoading, serverRatings, importRatingsMutation]);

  // Merge ratings: server + optimistic updates for auth users, localStorage for guests
  const ratings: Record<string, number> = (() => {
    if (isAuthenticated) {
      const base = serverRatings || {};
      const result = { ...base };

      // Apply optimistic updates
      for (const [id, value] of Object.entries(optimisticUpdates)) {
        if (value === null) {
          delete result[id];
        } else {
          result[id] = value;
        }
      }

      return result;
    } else {
      return localRatings;
    }
  })();

  // Set rating with optimistic update
  const setRating = useCallback(
    async (residencyId: Id<"residencies">, rating: number) => {
      if (isAuthenticated) {
        // Optimistic update
        setOptimisticUpdates((prev) => ({ ...prev, [residencyId]: rating }));

        try {
          await setRatingMutation({ residencyId, rating });
          // Clear optimistic update on success (server state will update via query)
          setOptimisticUpdates((prev) => {
            const next = { ...prev };
            delete next[residencyId];
            return next;
          });
        } catch (error) {
          // Rollback optimistic update on error
          setOptimisticUpdates((prev) => {
            const next = { ...prev };
            delete next[residencyId];
            return next;
          });
          console.error("Failed to set rating:", error);
          throw error;
        }
      } else {
        // Use localStorage for unauthenticated users
        const newRatings = { ...localRatings, [residencyId]: rating };
        setLocalRatings(newRatings);
        setLocalRatingsState(newRatings);
      }
    },
    [isAuthenticated, localRatings, setRatingMutation]
  );

  // Clear rating with optimistic update
  const clearRating = useCallback(
    async (residencyId: Id<"residencies">) => {
      if (isAuthenticated) {
        // Optimistic update (null means deleted)
        const previousValue = ratings[residencyId];
        setOptimisticUpdates((prev) => ({ ...prev, [residencyId]: null }));

        try {
          await clearRatingMutation({ residencyId });
          // Clear optimistic update on success
          setOptimisticUpdates((prev) => {
            const next = { ...prev };
            delete next[residencyId];
            return next;
          });
        } catch (error) {
          // Rollback optimistic update on error
          setOptimisticUpdates((prev) => {
            const next = { ...prev };
            if (previousValue !== undefined) {
              next[residencyId] = previousValue;
            } else {
              delete next[residencyId];
            }
            return next;
          });
          console.error("Failed to clear rating:", error);
          throw error;
        }
      } else {
        // Use localStorage for unauthenticated users
        const newRatings = { ...localRatings };
        delete newRatings[residencyId];
        setLocalRatings(newRatings);
        setLocalRatingsState(newRatings);
      }
    },
    [isAuthenticated, localRatings, ratings, clearRatingMutation]
  );

  // Toggle rating: set if different, clear if same
  const toggleRating = useCallback(
    async (residencyId: Id<"residencies">, rating: number) => {
      const currentRating = ratings[residencyId];
      if (currentRating === rating) {
        await clearRating(residencyId);
      } else {
        await setRating(residencyId, rating);
      }
    },
    [ratings, setRating, clearRating]
  );

  return {
    ratings,
    setRating,
    clearRating,
    toggleRating,
    isLoading: authLoading || (isAuthenticated && serverRatings === undefined),
  };
}
