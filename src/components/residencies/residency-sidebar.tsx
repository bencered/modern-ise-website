"use client";

import { useState, useEffect } from "react";
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
  MapPin,
  Star,
} from "lucide-react";
import Image from "next/image";

// localStorage helpers for personal ratings
const RATINGS_KEY = "residency_ratings";

function getPersonalRatings(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(RATINGS_KEY) || "{}");
  } catch {
    return {};
  }
}

function setPersonalRating(residencyId: string, stars: number) {
  const ratings = getPersonalRatings();
  ratings[residencyId] = stars;
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
}

function clearPersonalRating(residencyId: string) {
  const ratings = getPersonalRatings();
  delete ratings[residencyId];
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
}

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
  location?: string;
  company: Company | null;
  createdAt: string;
}

interface ResidencySidebarProps {
  residency: Residency | null;
  onClose: () => void;
  onRatingChange?: () => void;
}

function cleanName(name: string): string {
  return name
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/^R\d\+?\d?\s*[\|\s_-]+\s*/i, "") // Strip leading R1/R2/R1+2 patterns
    .replace(/\s*[\|\s_-]+R?\d+$/i, "") // Strip trailing -01, -02, R4, etc.
    .trim();
}

// Interactive star rating component
function InteractiveStarRating({ residencyId, onRatingChange }: {
  residencyId: string;
  onRatingChange?: () => void;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  useEffect(() => {
    const ratings = getPersonalRatings();
    setRating(ratings[residencyId] ?? null);
  }, [residencyId]);

  const handleRate = (stars: number) => {
    if (rating === stars) {
      // Clicking same star clears rating
      clearPersonalRating(residencyId);
      setRating(null);
    } else {
      setPersonalRating(residencyId, stars);
      setRating(stars);
    }
    onRatingChange?.();
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          onClick={() => handleRate(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(null)}
          className="p-0.5 hover:scale-110 transition-transform"
        >
          <Star
            className={`h-5 w-5 ${
              i <= (hoverRating ?? rating ?? 0)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
      {rating && (
        <span className="ml-2 text-xs text-muted-foreground">(click to clear)</span>
      )}
    </div>
  );
}

// Shared content component used by both sidebar and drawer
function ResidencyContent({ residency, onClose, showCloseButton = true, onRatingChange }: {
  residency: Residency;
  onClose: () => void;
  showCloseButton?: boolean;
  onRatingChange?: () => void;
}) {
  const rawName = residency.company?.name || residency.name.split("|")[1]?.trim() || residency.name || "";
  const companyName = cleanName(rawName);

  return (
    <div className="p-6">
      {/* Close button */}
      {showCloseButton && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}

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

      {/* Rate this position */}
      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Rate this position
        </h3>
        <InteractiveStarRating residencyId={residency._id} onRatingChange={onRatingChange} />
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

            {residency.location && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {residency.location}
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
  );
}

// Desktop sidebar
export function ResidencySidebar({ residency, onClose, onRatingChange }: ResidencySidebarProps) {
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
          <ResidencyContent residency={residency} onClose={onClose} onRatingChange={onRatingChange} />
        </ScrollArea>
      )}
    </div>
  );
}

// Mobile drawer content
export function ResidencyDrawerContent({ residency, onClose, onRatingChange }: ResidencySidebarProps) {
  if (!residency) return null;

  return (
    <ScrollArea className="max-h-[80vh] overflow-auto">
      <ResidencyContent residency={residency} onClose={onClose} showCloseButton={false} onRatingChange={onRatingChange} />
    </ScrollArea>
  );
}
