"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Quote,
  MessageSquarePlus,
  Send,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Id } from "../../../convex/_generated/dataModel";
import { useResidencyRatings } from "@/hooks/useResidencyRatings";

interface Company {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  website?: string;
}

interface FeaturedTestimonial {
  content: string;
  authorName: string;
  rating?: number;
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
  featuredTestimonial?: FeaturedTestimonial | null;
}

interface ResidencySidebarProps {
  residency: Residency | null;
  onClose: () => void;
  toggleRating?: (residencyId: Id<"residencies">, rating: number) => Promise<void>;
}

function cleanName(name: string): string {
  return name
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/^R\d\+?\d?\s*[\|\s_-]+\s*/i, "") // Strip leading R1/R2/R1+2 patterns
    .replace(/\s*[\|\s_-]+R?\d+$/i, "") // Strip trailing -01, -02, R4, etc.
    .trim();
}

// Interactive star rating component
function InteractiveStarRating({ residencyId, toggleRating }: {
  residencyId: Id<"residencies">;
  toggleRating?: (residencyId: Id<"residencies">, rating: number) => Promise<void>;
}) {
  const { ratings } = useResidencyRatings();
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const rating = ratings[residencyId] ?? null;

  const handleRate = async (stars: number) => {
    if (toggleRating) {
      await toggleRating(residencyId, stars);
    }
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

// Testimonial submission modal
function TestimonialModal({
  companyId,
  companyName,
  open,
  onOpenChange,
}: {
  companyId: Id<"companies">;
  companyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [residencyYear, setResidencyYear] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const submitTestimonial = useMutation(api.testimonials.submit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please write your testimonial");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await submitTestimonial({
        content: content.trim(),
        rating: rating ?? undefined,
        companyId,
        residencyYear: residencyYear.trim() || undefined,
        isAnonymous,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after closing
    setTimeout(() => {
      setContent("");
      setRating(null);
      setResidencyYear("");
      setIsAnonymous(false);
      setSuccess(false);
      setError("");
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Your Experience at {companyName}</DialogTitle>
          <DialogDescription>
            Help other students by sharing your experience working here.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div>
              <p className="font-medium">Testimonial Submitted!</p>
              <p className="text-sm text-muted-foreground">
                Your testimonial is pending approval and will be visible once reviewed.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClose} className="mt-2">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Warning Box */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-sm">
                  <p className="font-medium text-amber-600 dark:text-amber-400">
                    Before you submit
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">
                    <li>Your <strong>real name</strong> will be displayed unless you choose to post anonymously</li>
                    <li>Even anonymous testimonials are linked to your account internally</li>
                    <li>All testimonials are reviewed before publication</li>
                    <li>Avoid personal insults, inflammatory language, or defamatory content</li>
                    <li>Be honest and constructive in your feedback</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Your Testimonial</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your experience working at this company..."
                rows={4}
                maxLength={500}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">{content.length}/500 characters</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rating (optional)</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(rating === i ? null : i)}
                    onMouseEnter={() => setHoverRating(i)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        i <= (hoverRating ?? rating ?? 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
                {rating && (
                  <span className="ml-2 text-sm text-muted-foreground">(click to clear)</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Residency Year (optional)</label>
              <Input
                value={residencyYear}
                onChange={(e) => setResidencyYear(e.target.value)}
                placeholder="e.g., R1 2024"
                maxLength={20}
              />
            </div>

            {/* Anonymous Option */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="anonymous-modal"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border"
              />
              <div>
                <label htmlFor="anonymous-modal" className="cursor-pointer text-sm font-medium">
                  Post anonymously
                </label>
                <p className="text-xs text-muted-foreground">
                  Your name will be hidden from other users, but administrators can still see who
                  submitted it.
                </p>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" disabled={submitting || !content.trim()} className="w-full">
              {submitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Testimonial
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Shared content component used by both sidebar and drawer
function ResidencyContent({ residency, onClose, showCloseButton = true, toggleRating }: {
  residency: Residency;
  onClose: () => void;
  showCloseButton?: boolean;
  toggleRating?: (residencyId: Id<"residencies">, rating: number) => Promise<void>;
}) {
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
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
        {residency.company?.slug ? (
          <Link href={`/companies/${residency.company.slug}`} className="shrink-0">
            {residency.company?.imageUrl ? (
              <Image
                src={residency.company.imageUrl}
                alt={companyName}
                width={56}
                height={56}
                className="h-14 w-14 rounded-xl object-cover transition-opacity hover:opacity-80"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted transition-colors hover:bg-muted/80">
                <Building2 className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
          </Link>
        ) : residency.company?.imageUrl ? (
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
          {residency.company?.slug ? (
            <Link href={`/companies/${residency.company.slug}`} className="hover:underline">
              <h2 className="text-xl font-semibold leading-tight">
                {companyName}
              </h2>
            </Link>
          ) : (
            <h2 className="text-xl font-semibold leading-tight">
              {companyName}
            </h2>
          )}
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
        <InteractiveStarRating residencyId={residency._id as Id<"residencies">} toggleRating={toggleRating} />
      </div>

      {/* Testimonial callout */}
      {residency.company?._id && (
        <>
          <button
            onClick={() => setTestimonialModalOpen(true)}
            className="mt-4 flex w-full items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-left transition-colors hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/50 dark:hover:bg-blue-950"
          >
            <MessageSquarePlus className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Worked here before?
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Share your experience to help other students
              </p>
            </div>
          </button>
          <TestimonialModal
            companyId={residency.company._id as Id<"companies">}
            companyName={companyName}
            open={testimonialModalOpen}
            onOpenChange={setTestimonialModalOpen}
          />
        </>
      )}

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

        {/* Student Testimonial */}
        {residency.featuredTestimonial && (
          <>
            <div className="h-px bg-border" />

            <div className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Student Testimonial
              </h3>

              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <Quote className="h-5 w-5 shrink-0 text-muted-foreground/50" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed">
                      {residency.featuredTestimonial.content}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm font-medium">
                        — {residency.featuredTestimonial.authorName}
                      </span>
                      {residency.featuredTestimonial.rating && (
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i <= residency.featuredTestimonial!.rating!
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

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
export function ResidencySidebar({ residency, onClose, toggleRating }: ResidencySidebarProps) {
  return (
    <div
      className={`hidden lg:block sticky top-24 h-[calc(100vh-8rem)] w-[28rem] shrink-0 rounded-lg border bg-card transition-all duration-300 ${
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
          <ResidencyContent residency={residency} onClose={onClose} toggleRating={toggleRating} />
        </ScrollArea>
      )}
    </div>
  );
}

// Mobile drawer content
export function ResidencyDrawerContent({ residency, onClose, toggleRating }: ResidencySidebarProps) {
  if (!residency) return null;

  return (
    <ScrollArea className="max-h-[80vh] overflow-auto">
      <ResidencyContent residency={residency} onClose={onClose} showCloseButton={false} toggleRating={toggleRating} />
    </ScrollArea>
  );
}
