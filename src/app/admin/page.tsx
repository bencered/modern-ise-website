"use client";

import { useState, useCallback, DragEvent } from "react";
import { useQuery, useMutation, useAction, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Building2, Upload, Save, RefreshCw, Merge, Check, X, MapPin, Lock, LogOut, Star, CheckCircle, XCircle, Sparkles, Loader2, ShieldX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function NotAuthenticatedScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Admin Access</CardTitle>
          <p className="text-sm text-muted-foreground">
            Please sign in to access the admin panel
          </p>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/signin?redirect=/admin">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function NotAuthorizedScreen() {
  const { signOut } = useAuthActions();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <ShieldX className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle>Access Denied</CardTitle>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have admin access. Contact an administrator if you believe this is an error.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function CompanyCard({
  company,
  onUpload,
  uploading,
  selected,
  onSelect,
  mergeMode,
}: {
  company: { _id: Id<"companies">; name: string; slug: string; imageUrl: string | null };
  onUpload: (companyId: Id<"companies">, file: File) => void;
  uploading: boolean;
  selected: boolean;
  onSelect: (id: Id<"companies">) => void;
  mergeMode: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith("image/")) {
        onUpload(company._id, files[0]);
      }
    },
    [company._id, onUpload]
  );

  return (
    <Card
      className={`overflow-hidden transition-all ${
        dragOver ? "ring-2 ring-green-500 bg-green-500/5" : ""
      } ${selected ? "ring-2 ring-blue-500" : ""} ${
        mergeMode ? "cursor-pointer hover:bg-muted/50" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => mergeMode && onSelect(company._id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {company.imageUrl ? (
            <Image
              src={company.imageUrl}
              alt={company.name}
              width={48}
              height={48}
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base truncate">{company.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{company.slug}</p>
          </div>
          {mergeMode && selected && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
              <Check className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={`relative rounded-md border-2 border-dashed p-4 text-center transition-colors ${
            dragOver
              ? "border-green-500 bg-green-500/10"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onUpload(company._id, file);
              }
            }}
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Uploading...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" />
              {company.imageUrl ? "Drop to replace" : "Drop image here"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyManager() {
  const companies = useQuery(api.residencies.listCompanies);
  const generateUploadUrl = useMutation(api.mutations.generateUploadUrl);
  const updateCompanyImage = useMutation(api.mutations.updateCompanyImage);
  const mergeCompanies = useMutation(api.mutations.mergeCompanies);
  const [uploading, setUploading] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<Id<"companies">[]>([]);
  const [merging, setMerging] = useState(false);

  async function handleImageUpload(companyId: Id<"companies">, file: File) {
    setUploading(companyId);
    try {
      const uploadUrl = await generateUploadUrl({});
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await updateCompanyImage({ companyId, imageId: storageId });
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setUploading(null);
    }
  }

  function handleSelect(id: Id<"companies">) {
    setSelectedCompanies((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleMerge() {
    if (selectedCompanies.length < 2) return;
    setMerging(true);
    try {
      // First selected is the target, rest are sources
      const [targetId, ...sourceIds] = selectedCompanies;
      await mergeCompanies({ targetId, sourceIds });
      setSelectedCompanies([]);
      setMergeMode(false);
    } catch (error) {
      console.error("Failed to merge companies:", error);
    } finally {
      setMerging(false);
    }
  }

  if (!companies) {
    return <div className="text-muted-foreground">Loading companies...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {mergeMode
            ? `Select companies to merge (${selectedCompanies.length} selected - first selected will be kept)`
            : "Drag and drop images onto company cards to upload logos"}
        </p>
        <div className="flex gap-2">
          {mergeMode ? (
            <>
              <Button
                size="sm"
                onClick={handleMerge}
                disabled={selectedCompanies.length < 2 || merging}
              >
                {merging ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Merge className="mr-2 h-4 w-4" />
                )}
                Merge ({selectedCompanies.length})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setMergeMode(false);
                  setSelectedCompanies([]);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setMergeMode(true)}>
              <Merge className="mr-2 h-4 w-4" />
              Merge Companies
            </Button>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <CompanyCard
            key={company._id}
            company={company}
            onUpload={handleImageUpload}
            uploading={uploading === company._id}
            selected={selectedCompanies.includes(company._id)}
            onSelect={handleSelect}
            mergeMode={mergeMode}
          />
        ))}
      </div>
    </div>
  );
}

function ResidencyManager() {
  const residencies = useQuery(api.residencies.list);
  const updateDescription = useMutation(api.mutations.updateResidencyDescription);
  const updateLocation = useMutation(api.mutations.updateResidencyLocation);
  const [editingDescId, setEditingDescId] = useState<Id<"residencies"> | null>(null);
  const [editingLocId, setEditingLocId] = useState<Id<"residencies"> | null>(null);
  const [editDescValue, setEditDescValue] = useState("");
  const [editLocValue, setEditLocValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSaveDescription(residencyId: Id<"residencies">) {
    setSaving(true);
    try {
      await updateDescription({ residencyId, description: editDescValue });
      setEditingDescId(null);
    } catch (error) {
      console.error("Failed to save description:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveLocation(residencyId: Id<"residencies">) {
    setSaving(true);
    try {
      await updateLocation({ residencyId, location: editLocValue });
      setEditingLocId(null);
    } catch (error) {
      console.error("Failed to save location:", error);
    } finally {
      setSaving(false);
    }
  }

  if (!residencies) {
    return <div className="text-muted-foreground">Loading residencies...</div>;
  }

  return (
    <div className="space-y-4">
      {residencies.map((residency) => (
        <Card key={residency._id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">
                  {residency.company?.name || residency.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {residency.jobTitle}
                </p>
              </div>
              <Badge variant="outline">{residency.residencyType}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                Location
              </div>
              {editingLocId === residency._id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editLocValue}
                    onChange={(e) => setEditLocValue(e.target.value)}
                    placeholder="e.g. Dublin, Ireland"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSaveLocation(residency._id)}
                    disabled={saving}
                  >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingLocId(null)}
                    disabled={saving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {residency.location || <span className="italic">Not set</span>}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                    onClick={() => {
                      setEditingLocId(residency._id);
                      setEditLocValue(residency.location || "");
                    }}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Description</div>
              {editingDescId === residency._id ? (
                <div className="space-y-3">
                  <Textarea
                    value={editDescValue}
                    onChange={(e) => setEditDescValue(e.target.value)}
                    placeholder="Enter job description..."
                    rows={6}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveDescription(residency._id)}
                      disabled={saving}
                    >
                      {saving ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingDescId(null)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {residency.description ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {residency.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No description set
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingDescId(residency._id);
                      setEditDescValue(residency.description || "");
                    }}
                  >
                    Edit Description
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SyncManager() {
  const triggerSync = useAction(api.sync.triggerSync);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const data = await triggerSync({});
      setResult(`Synced ${data.synced} residencies`);
    } catch (error) {
      console.error("Sync error:", error);
      setResult("Failed to sync");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync from Softr</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Manually trigger a sync to fetch the latest residency data from Softr.
          This runs automatically every day at 9pm.
        </p>
        <div className="flex items-center gap-4">
          <Button onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
          {result && (
            <span className="text-sm text-muted-foreground">{result}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TestimonialManager() {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const testimonials = useQuery(api.testimonials.listAll, { status: statusFilter || undefined });
  const approve = useMutation(api.testimonials.approve);
  const reject = useMutation(api.testimonials.reject);
  const setFeatured = useMutation(api.testimonials.setFeatured);
  const unsetFeatured = useMutation(api.testimonials.unsetFeatured);
  const deleteTestimonial = useMutation(api.testimonials.deleteTestimonial);
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleApprove(testimonialId: Id<"testimonials">) {
    setProcessing(testimonialId);
    try {
      await approve({ testimonialId });
    } catch (error) {
      console.error("Failed to approve:", error);
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(testimonialId: Id<"testimonials">) {
    setProcessing(testimonialId);
    try {
      await reject({ testimonialId });
    } catch (error) {
      console.error("Failed to reject:", error);
    } finally {
      setProcessing(null);
    }
  }

  async function handleSetFeatured(testimonialId: Id<"testimonials">) {
    setProcessing(testimonialId);
    try {
      await setFeatured({ testimonialId });
    } catch (error) {
      console.error("Failed to set featured:", error);
    } finally {
      setProcessing(null);
    }
  }

  async function handleUnsetFeatured(testimonialId: Id<"testimonials">) {
    setProcessing(testimonialId);
    try {
      await unsetFeatured({ testimonialId });
    } catch (error) {
      console.error("Failed to unset featured:", error);
    } finally {
      setProcessing(null);
    }
  }

  async function handleDelete(testimonialId: Id<"testimonials">) {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    setProcessing(testimonialId);
    try {
      await deleteTestimonial({ testimonialId });
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setProcessing(null);
    }
  }

  if (!testimonials) {
    return <div className="text-muted-foreground">Loading testimonials...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Filter:</span>
        <div className="flex gap-2">
          {["pending", "approved", "rejected", ""].map((status) => (
            <Button
              key={status || "all"}
              size="sm"
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
            >
              {status || "All"}
            </Button>
          ))}
        </div>
      </div>

      {testimonials.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No {statusFilter || ""} testimonials found.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {testimonials.map((testimonial) => (
            <Card key={testimonial._id} className={testimonial.isFeatured ? "border-green-500/50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {testimonial.company?.name || "Unknown Company"}
                      {testimonial.isFeatured && (
                        <Badge className="bg-green-500 text-white">Featured</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        by {testimonial.authorName}
                      </span>
                      {testimonial.residencyYear && (
                        <Badge variant="secondary" className="text-xs">
                          {testimonial.residencyYear}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      testimonial.status === "approved"
                        ? "default"
                        : testimonial.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {testimonial.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{testimonial.content}</p>

                {testimonial.rating && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i <= testimonial.rating!
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {testimonial.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(testimonial._id)}
                        disabled={processing === testimonial._id}
                      >
                        {processing === testimonial._id ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(testimonial._id)}
                        disabled={processing === testimonial._id}
                      >
                        {processing === testimonial._id ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Reject
                      </Button>
                    </>
                  )}
                  {testimonial.status === "approved" && (
                    <>
                      {testimonial.isFeatured ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnsetFeatured(testimonial._id)}
                          disabled={processing === testimonial._id}
                        >
                          {processing === testimonial._id ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                          )}
                          Unset Featured
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetFeatured(testimonial._id)}
                          disabled={processing === testimonial._id}
                        >
                          {processing === testimonial._id ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                          )}
                          Set Featured
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(testimonial._id)}
                    disabled={processing === testimonial._id}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Submitted {new Date(testimonial.createdAt).toLocaleDateString("en-IE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const adminStatus = useQuery(api.admin.isAdmin, isAuthenticated ? {} : "skip");

  // Loading state
  if (authLoading || (isAuthenticated && adminStatus === undefined)) {
    return <LoadingScreen />;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <NotAuthenticatedScreen />;
  }

  // Not an admin
  if (!adminStatus?.isAdmin) {
    return <NotAuthorizedScreen />;
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage company logos and residency information
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="companies" className="space-y-6">
          <TabsList>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="residencies">Residencies</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="sync">Sync</TabsTrigger>
          </TabsList>

          <TabsContent value="companies">
            <CompanyManager />
          </TabsContent>

          <TabsContent value="residencies">
            <ResidencyManager />
          </TabsContent>

          <TabsContent value="testimonials">
            <TestimonialManager />
          </TabsContent>

          <TabsContent value="sync">
            <SyncManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
