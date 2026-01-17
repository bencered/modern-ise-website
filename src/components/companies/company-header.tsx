"use client";

import { Building2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface CompanyHeaderProps {
  name: string;
  imageUrl?: string | null;
  industry?: string | null;
  headquarters?: string | null;
  residencyCount: number;
}

export function CompanyHeader({
  name,
  imageUrl,
  industry,
  headquarters,
  residencyCount,
}: CompanyHeaderProps) {
  return (
    <div className="flex items-start gap-4 md:gap-6">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={80}
          height={80}
          className="h-16 w-16 md:h-20 md:w-20 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 md:h-20 md:w-20 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Building2 className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {industry && (
            <Badge variant="secondary">{industry}</Badge>
          )}
          {headquarters && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {headquarters}
            </div>
          )}
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
            {residencyCount} {residencyCount === 1 ? "position" : "positions"}
          </Badge>
        </div>
      </div>
    </div>
  );
}
