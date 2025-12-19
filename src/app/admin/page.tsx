"use client";

import { useState, useCallback, DragEvent } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Building2, Upload, Save, RefreshCw, Merge, Check, X } from "lucide-react";
import Image from "next/image";

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
      const uploadUrl = await generateUploadUrl();
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
  const [editingId, setEditingId] = useState<Id<"residencies"> | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave(residencyId: Id<"residencies">) {
    setSaving(true);
    try {
      await updateDescription({ residencyId, description: editValue });
      setEditingId(null);
    } catch (error) {
      console.error("Failed to save description:", error);
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
          <CardContent>
            {editingId === residency._id ? (
              <div className="space-y-3">
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter job description..."
                  rows={6}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSave(residency._id)}
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
                    onClick={() => setEditingId(null)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
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
                    setEditingId(residency._id);
                    setEditValue(residency.description || "");
                  }}
                >
                  Edit Description
                </Button>
              </div>
            )}
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
      const data = await triggerSync();
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

export default function AdminPage() {
  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage company logos and residency information
          </p>
        </div>

        <Tabs defaultValue="companies" className="space-y-6">
          <TabsList>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="residencies">Residencies</TabsTrigger>
            <TabsTrigger value="sync">Sync</TabsTrigger>
          </TabsList>

          <TabsContent value="companies">
            <CompanyManager />
          </TabsContent>

          <TabsContent value="residencies">
            <ResidencyManager />
          </TabsContent>

          <TabsContent value="sync">
            <SyncManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
