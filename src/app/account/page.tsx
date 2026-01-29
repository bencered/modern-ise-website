"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Download, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AccountPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();

  const userData = useQuery(
    api.account.exportMyData,
    isAuthenticated ? {} : "skip"
  );
  const deleteAccount = useMutation(api.account.deleteMyAccount);

  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!userData) return;

    setIsExporting(true);
    try {
      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ise-residencies-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== "DELETE") return;

    setIsDeleting(true);
    setError(null);
    try {
      await deleteAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setIsDeleting(false);
      return;
    }

    // Account deleted successfully - sign out and redirect
    // Don't catch errors here since account is already gone
    await signOut();
    router.push("/");
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-white dark:bg-background">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="h-8 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-white dark:bg-background">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                You need to be signed in to access your account settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/signin?redirect=/account">
                <Button>Sign in</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Account Settings</h1>

        <div className="space-y-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>
                Information associated with your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userData ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    {userData.profile.name || "Not set"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {userData.profile.email || "Not set"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Testimonials:</span>{" "}
                    {userData.testimonials.length}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Ratings:</span>{" "}
                    {userData.ratings.length}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Rankings:</span>{" "}
                    {userData.companyRankings.length}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-4 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Your Data
              </CardTitle>
              <CardDescription>
                Download a copy of all your data in JSON format. This includes
                your profile, testimonials, ratings, and company rankings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleExport}
                disabled={isExporting || !userData}
                variant="outline"
              >
                {isExporting ? "Preparing download..." : "Download my data"}
              </Button>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">Delete my account</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Delete Account
                    </DialogTitle>
                    <DialogDescription>
                      This will permanently delete:
                    </DialogDescription>
                  </DialogHeader>
                  <ul className="ml-6 list-disc text-sm text-muted-foreground">
                    <li>Your profile and account</li>
                    <li>All your testimonials ({userData?.testimonials.length ?? 0})</li>
                    <li>All your ratings ({userData?.ratings.length ?? 0})</li>
                    <li>All your company rankings ({userData?.companyRankings.length ?? 0})</li>
                  </ul>
                  <p className="text-sm font-medium">
                    Type <span className="font-mono text-red-600">DELETE</span> to
                    confirm:
                  </p>
                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="DELETE"
                    className="font-mono"
                  />
                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeleteDialogOpen(false);
                        setDeleteConfirmation("");
                        setError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleteConfirmation !== "DELETE" || isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete permanently"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Privacy Policy Link */}
          <p className="text-center text-sm text-muted-foreground">
            Read our{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline dark:text-blue-400">
              Privacy Policy
            </Link>{" "}
            to learn how we handle your data.
          </p>
        </div>
      </div>
    </main>
  );
}
