"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BriefcaseBusiness, Building2 } from "lucide-react";
import Image from "next/image";

interface Company {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
}

interface Residency {
  _id: string;
  name: string;
  residencyType: string;
  residencyTitle: string;
  jobTitle: string;
  monthlySalary?: string;
  company: Company | null;
}

interface ResidencyCardProps {
  residency: Residency;
  isSelected: boolean;
  onClick: () => void;
}

function formatSalary(salary?: string): string | null {
  if (!salary) return null;

  const lower = salary.toLowerCase().trim();
  if (lower === "competitive" || lower === "tbc" || lower === "n/d") {
    return salary;
  }

  // Look for explicit euro amounts (€X,XXX or €XXXX format)
  const euroMatch = salary.match(/€\s*([\d,]+)/);
  if (euroMatch) {
    const num = euroMatch[1].replace(/,/g, "");
    // Only show if it's a reasonable salary amount (3+ digits)
    if (num.length >= 3) {
      return `€${euroMatch[1]}`;
    }
  }

  // If salary text is long (description-like), show "See details"
  if (salary.length > 50) {
    return "See details";
  }

  // For short values that aren't euro amounts, show as-is
  if (salary.length <= 20) {
    return salary;
  }

  return "See details";
}

function cleanName(name: string): string {
  return name
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/^R\d\+?\d?\s*[\|\s_-]+\s*/i, "") // Strip leading R1/R2/R1+2 patterns
    .replace(/\s*[\|\s_-]+R?\d+$/i, "") // Strip trailing -01, -02, R4, etc.
    .trim();
}

export function ResidencyCard({ residency, isSelected, onClick }: ResidencyCardProps) {
  const rawName = residency.company?.name || residency.name.split("|")[1]?.trim() || residency.name;
  const companyName = cleanName(rawName);
  const formattedSalary = formatSalary(residency.monthlySalary);

  return (
    <Card
      onClick={onClick}
      className={`group cursor-pointer border-border/50 bg-card transition-all duration-200 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/5 ${
        isSelected ? "border-green-500 ring-1 ring-green-500" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {residency.company?.imageUrl ? (
              <Image
                src={residency.company.imageUrl}
                alt={companyName}
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1 overflow-hidden">
              <h3 className="line-clamp-2 break-all font-semibold leading-tight">{companyName}</h3>
              <p className="line-clamp-2 break-all text-sm text-muted-foreground">
                {residency.residencyTitle}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
          >
            {residency.residencyType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="line-clamp-2">{residency.jobTitle}</span>
          </div>

          {formattedSalary && (
            <Badge variant="secondary" className="font-mono text-xs">
              {formattedSalary}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ResidencyCardSkeleton() {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
