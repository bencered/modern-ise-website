import { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc } from "../_generated/dataModel";

/**
 * Check if the current user is an admin.
 * Admin status is set via the `isAdmin` boolean field on the user document.
 * This can be toggled in the Convex dashboard.
 *
 * @throws Error if user is not authenticated or not an admin
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Authentication required");
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Check for isAdmin field (set via Convex dashboard)
  if (!user.isAdmin) {
    throw new Error("Admin access required");
  }

  return user;
}

/**
 * Check if the current user is an admin (for actions).
 * Actions need to call a query/mutation to check admin status.
 */
export async function requireAdminAction(
  ctx: ActionCtx,
  runQuery: <T>(fn: (ctx: QueryCtx) => Promise<T>) => Promise<T>
): Promise<void> {
  // This is a placeholder - actions should call an internal query to verify admin status
  throw new Error("Use internal query to verify admin status in actions");
}
