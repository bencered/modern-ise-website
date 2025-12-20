"use client";

import { useState, useCallback, DragEvent, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Upload, Save, RefreshCw, Merge, Check, X, MapPin, Lock, LogOut } from "lucide-react";
import Image from "next/image";

const ADMIN_PASSWORD_KEY = "admin_password";

function useAdminPassword() {
  const [password, setPassword] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_PASSWORD_KEY);
    if (stored) {
      setPassword(stored);
    }
  }, []);

  const login = (pwd: string) => {
    localStorage.setItem(ADMIN_PASSWORD_KEY, pwd);
    setPassword(pwd);
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_PASSWORD_KEY);
    setPassword(null);
  };

  return { password, login, logout, isLoggedIn: !!password };
}

function LoginScreen({ onLogin }: { onLogin: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const verifyPassword = useMutation(api.admin.verifyPassword);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await verifyPassword({ password });
      onLogin(password);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid password";
      // Extract the actual error message from ConvexError
      if (message.includes("Too many login attempts")) {
        setError(message);
      } else {
        setError("Invalid password");
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Admin Access</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter the admin password to continue
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
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

function CompanyManager({ adminPassword, onAuthError }: { adminPassword: string; onAuthError: () => void }) {
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
      const uploadUrl = await generateUploadUrl({ adminPassword });
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await updateCompanyImage({ adminPassword, companyId, imageId: storageId });
    } catch (error) {
      console.error("Failed to upload image:", error);
      if (error instanceof Error && error.message.includes("Invalid admin password")) {
        onAuthError();
      }
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
      await mergeCompanies({ adminPassword, targetId, sourceIds });
      setSelectedCompanies([]);
      setMergeMode(false);
    } catch (error) {
      console.error("Failed to merge companies:", error);
      if (error instanceof Error && error.message.includes("Invalid admin password")) {
        onAuthError();
      }
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

function ResidencyManager({ adminPassword, onAuthError }: { adminPassword: string; onAuthError: () => void }) {
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
      await updateDescription({ adminPassword, residencyId, description: editDescValue });
      setEditingDescId(null);
    } catch (error) {
      console.error("Failed to save description:", error);
      if (error instanceof Error && error.message.includes("Invalid admin password")) {
        onAuthError();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveLocation(residencyId: Id<"residencies">) {
    setSaving(true);
    try {
      await updateLocation({ adminPassword, residencyId, location: editLocValue });
      setEditingLocId(null);
    } catch (error) {
      console.error("Failed to save location:", error);
      if (error instanceof Error && error.message.includes("Invalid admin password")) {
        onAuthError();
      }
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

function SyncManager({ adminPassword, onAuthError }: { adminPassword: string; onAuthError: () => void }) {
  const triggerSync = useAction(api.sync.triggerSync);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const data = await triggerSync({ adminPassword });
      setResult(`Synced ${data.synced} residencies`);
    } catch (error) {
      console.error("Sync error:", error);
      if (error instanceof Error && error.message.includes("Invalid admin password")) {
        onAuthError();
        setResult("Authentication failed");
      } else {
        setResult("Failed to sync");
      }
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

export default function AdminPage() {
  const { password, login, logout, isLoggedIn } = useAdminPassword();

  if (!isLoggedIn) {
    return <LoginScreen onLogin={login} />;
  }

  const handleAuthError = () => {
    logout();
  };

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
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="companies" className="space-y-6">
          <TabsList>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="residencies">Residencies</TabsTrigger>
            <TabsTrigger value="sync">Sync</TabsTrigger>
          </TabsList>

          <TabsContent value="companies">
            <CompanyManager adminPassword={password!} onAuthError={handleAuthError} />
          </TabsContent>

          <TabsContent value="residencies">
            <ResidencyManager adminPassword={password!} onAuthError={handleAuthError} />
          </TabsContent>

          <TabsContent value="sync">
            <SyncManager adminPassword={password!} onAuthError={handleAuthError} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
