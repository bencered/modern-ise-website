"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BriefcaseBusiness, Banknote, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Residency {
  _id: string;
  name: string;
  residencyType: string;
  residencyTitle: string;
  jobTitle: string;
  monthlySalary?: string;
  location?: string;
}

interface CompanyResidenciesProps {
  residencies: Residency[];
  companyName: string;
}

function formatSalary(salary?: string): string | null {
  if (!salary) return null;
  const firstLine = salary.split(/\n/)[0].trim();
  if (!firstLine) return null;
  if (firstLine.length > 50) {
    return firstLine.slice(0, 50) + "...";
  }
  return firstLine;
}

export function CompanyResidencies({ residencies, companyName }: CompanyResidenciesProps) {
  if (residencies.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          No open positions at {companyName} at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Open Positions</h2>
        <Button variant="outline" size="sm" asChild>
          <Link href="/residencies">
            View All Positions
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {residencies.map((residency) => (
          <Card key={residency._id} className="group transition-all hover:border-green-500/50 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base line-clamp-1">
                    {residency.residencyTitle}
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                >
                  {residency.residencyType}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="line-clamp-1">{residency.jobTitle}</span>
              </div>
              {residency.location && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{residency.location}</span>
                </div>
              )}
              {residency.monthlySalary && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Banknote className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formatSalary(residency.monthlySalary)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
