"use client";

import { useState } from "react";
import { usePreloadedQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Preloaded } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Quote, Star, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useConvexAuth } from "convex/react";

interface TestimonialsListProps {
  preloadedTestimonials: Preloaded<typeof api.testimonials.listApproved>;
  preloadedCompanies: Preloaded<typeof api.residencies.listCompanies>;
}

function cleanName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/^R\d\+?\d?\s*[\|\s_-]+\s*/i, "")
    .replace(/\s*[\|\s_-]+R?\d+$/i, "")
    .trim();
}

type TestimonialSize = "small" | "medium" | "large";

function getTestimonialSize(content: string): TestimonialSize {
  const length = content.length;
  if (length < 200) return "small";
  if (length < 500) return "medium";
  return "large";
}

export function TestimonialsList({ preloadedTestimonials, preloadedCompanies }: TestimonialsListProps) {
  const testimonials = usePreloadedQuery(preloadedTestimonials);
  const companies = usePreloadedQuery(preloadedCompanies);
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [residencyYear, setResidencyYear] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitTestimonial = useMutation(api.testimonials.submit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !content.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitTestimonial({
        companyId: selectedCompany as Id<"companies">,
        content: content.trim(),
        rating: rating ?? undefined,
        residencyYear: residencyYear || undefined,
        isAnonymous,
      });
      setSubmitSuccess(true);
      setContent("");
      setRating(null);
      setSelectedCompany("");
      setResidencyYear("");
      setIsAnonymous(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit testimonial");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Submit Form Section */}
      <div>
        {authLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !isAuthenticated ? (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground">
                Please{" "}
                <Link href="/signin?redirect=/testimonials" className="text-green-600 hover:underline dark:text-green-400">
                  sign in
                </Link>{" "}
                to submit a testimonial.
              </p>
            </CardContent>
          </Card>
        ) : submitSuccess ? (
          <Card>
            <CardContent className="py-6 text-center">
              <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-600 dark:text-green-400" />
              <p className="font-medium">Thank you for your testimonial!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                It will be visible after review by our team.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSubmitSuccess(false)}
              >
                Submit Another
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <details className="group">
              <summary className="flex w-full cursor-pointer items-center gap-2 p-4 text-lg font-semibold list-none [&::-webkit-details-marker]:hidden">
                <span className="flex h-5 w-5 items-center justify-center rounded border text-xs transition-transform group-open:rotate-90">›</span>
                Share Your Experience
              </summary>

              <CardContent className="border-t pt-6">
                {/* Warning */}
                <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-50 p-4 dark:bg-amber-950/30">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-700 dark:text-amber-400">
                        Before you submit
                      </p>
                      <ul className="mt-2 list-disc pl-4 text-amber-900/80 dark:text-amber-100/70 space-y-1">
                        <li>Your <strong>real name</strong> will be displayed unless you post anonymously</li>
                        <li>Anonymous testimonials are still linked to your account internally</li>
                        <li>All testimonials are reviewed before publication</li>
                        <li>Avoid personal insults, inflammatory language, or defamatory content</li>
                        <li>Abuse may result in escalation to ISE staff</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Two Column Layout for Company & Year */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company *</Label>
                      <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                        <SelectTrigger id="company">
                          <SelectValue placeholder="Select a company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company._id} value={company._id}>
                              <div className="flex items-center gap-2">
                                {company.imageUrl ? (
                                  <Image
                                    src={company.imageUrl}
                                    alt={company.name}
                                    width={20}
                                    height={20}
                                    className="h-5 w-5 rounded object-cover"
                                  />
                                ) : (
                                  <Building2 className="h-5 w-5 text-muted-foreground" />
                                )}
                                {cleanName(company.name)}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Year (optional)</Label>
                      <Input
                        id="year"
                        value={residencyYear}
                        onChange={(e) => setResidencyYear(e.target.value)}
                        placeholder="R1 2024"
                        maxLength={20}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <Label htmlFor="content">Your Experience *</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Share your experience working at this company during your residency..."
                      rows={4}
                    />
                  </div>

                  {/* Rating and Anonymous in a row */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Rating:</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setRating(rating === i ? null : i)}
                            onMouseEnter={() => setHoverRating(i)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="p-0.5 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`h-5 w-5 ${i <= (hoverRating ?? rating ?? 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/30"
                                }`}
                            />
                          </button>
                        ))}
                      </div>
                      {rating && (
                        <span className="text-xs text-muted-foreground">({rating}/5)</span>
                      )}
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="h-4 w-4 rounded border-border"
                      />
                      <span className="text-sm">Post anonymously</span>
                    </label>
                  </div>

                  {/* Error Message */}
                  {submitError && (
                    <div className="rounded-lg border border-red-500/30 bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                      {submitError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={!selectedCompany || content.trim().length < 10 || isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Testimonial"
                    )}
                  </Button>
                </form>
              </CardContent>
            </details>
          </Card>
        )}
      </div>

      {/* Testimonials Grid */}
      <div>
        <h2 className="mb-6 text-2xl font-semibold">All Testimonials</h2>
        {!isAuthenticated && !authLoading ? (
          <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
            <p className="text-muted-foreground">
              Please{" "}
              <Link href="/signin?redirect=/testimonials" className="text-green-600 hover:underline dark:text-green-400">
                sign in
              </Link>{" "}
              to view testimonials.
            </p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
            <p className="text-muted-foreground">
              No testimonials yet. Be the first to share your experience!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]" style={{ gridAutoFlow: 'dense' }}>
            {testimonials.map((testimonial) => {
              const size = getTestimonialSize(testimonial.content);
              return (
                <TestimonialCard
                  key={testimonial._id}
                  testimonial={testimonial}
                  size={size}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface TestimonialCardProps {
  testimonial: {
    _id: Id<"testimonials">;
    content: string;
    authorName: string;
    rating?: number;
    residencyYear?: string;
    createdAt: number;
    company: {
      _id: Id<"companies">;
      name: string;
      slug: string;
      imageUrl?: string | null;
    } | null;
  };
  size: TestimonialSize;
}

function TestimonialCard({ testimonial, size }: TestimonialCardProps) {
  const companyName = testimonial.company ? cleanName(testimonial.company.name) : "Unknown Company";

  const sizeClasses = {
    small: "",
    medium: "md:col-span-2 md:row-span-1",
    large: "md:col-span-2 md:row-span-2",
  };

  return (
    <Card className={`flex flex-col h-full ${sizeClasses[size]}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {testimonial.company?.slug ? (
            <Link href={`/companies/${testimonial.company.slug}`} className="shrink-0">
              {testimonial.company?.imageUrl ? (
                <Image
                  src={testimonial.company.imageUrl}
                  alt={companyName}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-lg object-cover transition-opacity hover:opacity-80"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-muted/80">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </Link>
          ) : testimonial.company?.imageUrl ? (
            <Image
              src={testimonial.company.imageUrl}
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
          <div className="min-w-0 flex-1">
            {testimonial.company?.slug ? (
              <Link
                href={`/companies/${testimonial.company.slug}`}
                className="font-semibold hover:underline"
              >
                {companyName}
              </Link>
            ) : (
              <span className="font-semibold">{companyName}</span>
            )}
            {testimonial.rating && (
              <div className="flex items-center gap-1 mt-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i <= testimonial.rating!
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                      }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <div className="flex items-start gap-2">
          <Quote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
          <p className="text-sm leading-relaxed">{testimonial.content}</p>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">— {testimonial.authorName}</span>
          {testimonial.residencyYear && (
            <span>{testimonial.residencyYear}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
