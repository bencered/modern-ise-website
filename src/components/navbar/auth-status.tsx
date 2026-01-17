"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { LogOut } from "lucide-react";

export function AuthStatus() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (isLoading) {
    return (
      <div className="h-9 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
    );
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/signin"
        className="flex items-center gap-2 border border-neutral-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        Sign in
      </Link>
    );
  }

  return (
    <button
      onClick={() => signOut()}
      className="flex items-center gap-2 border border-neutral-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}

export function AuthStatusMobile() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Link href="/signin" className="text-blue-500">
        Sign in
      </Link>
    );
  }

  return (
    <button
      onClick={() => signOut()}
      className="flex items-center gap-2 text-red-500"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
