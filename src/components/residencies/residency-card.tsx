"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BriefcaseBusiness, Building2, Star } from "lucide-react";
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
  personalRating?: number;
  aggregateCount?: number;
}

function formatSalary(salary?: string): string | null {
  if (!salary) return null;

  // Get first line only
  const firstLine = salary.split(/\n/)[0].trim();
  if (!firstLine) return null;

  // Truncate if too long
  if (firstLine.length > 50) {
    return firstLine.slice(0, 50) + "…";
  }

  return firstLine;
}

function cleanName(name: string): string {
  return name
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/^R\d\+?\d?\s*[\|\s_-]+\s*/i, "") // Strip leading R1/R2/R1+2 patterns
    .replace(/\s*[\|\s_-]+R?\d+$/i, "") // Strip trailing -01, -02, R4, etc.
    .trim();
}

export function ResidencyCard({ residency, isSelected, onClick, personalRating, aggregateCount }: ResidencyCardProps) {
  const rawName = residency.company?.name || residency.name.split("|")[1]?.trim() || residency.name;
  const companyName = cleanName(rawName);
  const formattedSalary = formatSalary(residency.monthlySalary);

  return (
    <Card
      data-residency-id={residency._id}
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

          <div className="flex items-center gap-2">
            {aggregateCount && (
              <Badge className="bg-blue-500 text-white hover:bg-blue-600">
                {aggregateCount} {aggregateCount === 1 ? "position" : "positions"}
              </Badge>
            )}
            {formattedSalary && (
              <Badge variant="secondary" className="font-mono text-xs">
                {formattedSalary}
              </Badge>
            )}
            {personalRating && (
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i <= personalRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
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
