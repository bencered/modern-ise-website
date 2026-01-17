"use client";

import { Globe, Linkedin, BookOpen, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompanyLinksProps {
  website?: string | null;
  linkedinUrl?: string | null;
  wikipediaUrl?: string | null;
  glassdoorUrl?: string | null;
}

export function CompanyLinks({
  website,
  linkedinUrl,
  wikipediaUrl,
  glassdoorUrl,
}: CompanyLinksProps) {
  const hasLinks = website || linkedinUrl || wikipediaUrl || glassdoorUrl;

  if (!hasLinks) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {website && (
        <Button variant="outline" size="sm" asChild>
          <a href={website} target="_blank" rel="noopener noreferrer">
            <Globe className="mr-2 h-4 w-4" />
            Website
          </a>
        </Button>
      )}
      {linkedinUrl && (
        <Button variant="outline" size="sm" asChild>
          <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
            <Linkedin className="mr-2 h-4 w-4" />
            LinkedIn
          </a>
        </Button>
      )}
      {wikipediaUrl && (
        <Button variant="outline" size="sm" asChild>
          <a href={wikipediaUrl} target="_blank" rel="noopener noreferrer">
            <BookOpen className="mr-2 h-4 w-4" />
            Wikipedia
          </a>
        </Button>
      )}
      {glassdoorUrl && (
        <Button variant="outline" size="sm" asChild>
          <a href={glassdoorUrl} target="_blank" rel="noopener noreferrer">
            <Building className="mr-2 h-4 w-4" />
            Glassdoor
          </a>
        </Button>
      )}
    </div>
  );
}
