"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  BriefcaseBusiness,
  Building2,
  Mail,
  Banknote,
  Home,
  X,
  FileText,
} from "lucide-react";
import Image from "next/image";

interface Company {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  website?: string;
}

interface Residency {
  _id: string;
  name: string;
  residencyType: string;
  residencyTitle: string;
  jobTitle: string;
  description?: string;
  monthlySalary?: string;
  emailAddress?: string;
  accommodationSupport?: string;
  company: Company | null;
  createdAt: string;
}

interface ResidencySidebarProps {
  residency: Residency | null;
  onClose: () => void;
}

function cleanName(name: string): string {
  return name
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/^R\d\+?\d?\s*[\|\s_-]+\s*/i, "") // Strip leading R1/R2/R1+2 patterns
    .replace(/\s*[\|\s_-]+R?\d+$/i, "") // Strip trailing -01, -02, R4, etc.
    .trim();
}

export function ResidencySidebar({ residency, onClose }: ResidencySidebarProps) {
  const rawName = residency?.company?.name || residency?.name.split("|")[1]?.trim() || residency?.name || "";
  const companyName = cleanName(rawName);

  return (
    <div
      className={`hidden lg:block sticky top-24 h-[calc(100vh-8rem)] w-96 shrink-0 rounded-lg border bg-card transition-all duration-300 ${
        residency ? "opacity-100" : "opacity-50"
      }`}
    >
      {!residency ? (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">No position selected</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Click on a position to view details
          </p>
        </div>
      ) : (
        <ScrollArea className="h-full">
          <div className="p-6">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>

            {/* Header */}
            <div className="flex items-start gap-4 pr-8">
              {residency.company?.imageUrl ? (
                <Image
                  src={residency.company.imageUrl}
                  alt={companyName}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Building2 className="h-7 w-7 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold leading-tight">
                  {companyName}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {residency.residencyTitle}
                </p>
                <Badge
                  variant="outline"
                  className="mt-2 border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                >
                  {residency.residencyType}
                </Badge>
              </div>
            </div>

            <div className="mt-6 h-px bg-border" />

            {/* Details */}
            <div className="mt-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Position Details
                </h3>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <BriefcaseBusiness className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Job Title</p>
                      <p className="text-sm text-muted-foreground">
                        {residency.jobTitle}
                      </p>
                    </div>
                  </div>

                  {residency.monthlySalary && (
                    <div className="flex items-start gap-3">
                      <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Monthly Salary</p>
                        <p className="whitespace-pre-line text-sm text-muted-foreground">
                          {residency.monthlySalary}
                        </p>
                      </div>
                    </div>
                  )}

                  {residency.accommodationSupport &&
                    residency.accommodationSupport !== "-" &&
                    residency.accommodationSupport.toLowerCase() !== "n/a" && (
                      <div className="flex items-start gap-3">
                        <Home className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            Accommodation Support
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {residency.accommodationSupport}
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Description */}
              {residency.description && (
                <>
                  <div className="h-px bg-border" />
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      Description
                    </h3>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">
                      {residency.description}
                    </p>
                  </div>
                </>
              )}

              {/* Contact */}
              {residency.emailAddress && (
                <>
                  <div className="h-px bg-border" />

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      Contact
                    </h3>

                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <a
                          href={`mailto:${residency.emailAddress}`}
                          className="text-sm text-green-600 hover:underline dark:text-green-400"
                        >
                          {residency.emailAddress}
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 h-px bg-border" />

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Posted{" "}
              {new Date(residency.createdAt).toLocaleDateString("en-IE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
