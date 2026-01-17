"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Send, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";

interface TestimonialFormProps {
  companyId: Id<"companies">;
  companyName: string;
}

export function TestimonialForm({ companyId, companyName }: TestimonialFormProps) {
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
      setContent("");
      setRating(null);
      setResidencyYear("");
      setIsAnonymous(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div>
              <p className="font-medium">Testimonial Submitted!</p>
              <p className="text-sm text-muted-foreground">
                Your testimonial is pending approval and will be visible once reviewed.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSuccess(false)}
              className="mt-2"
            >
              Write Another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Share Your Experience at {companyName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Warning Box */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-sm">
                <p className="font-medium text-amber-600 dark:text-amber-400">
                  Before you submit
                </p>
                <ul className="mt-1 list-disc pl-4 text-muted-foreground space-y-1">
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
            <p className="text-xs text-muted-foreground">
              {content.length}/500 characters
            </p>
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
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-6 w-6 ${i <= (hoverRating ?? rating ?? 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                      }`}
                  />
                </button>
              ))}
              {rating && (
                <span className="ml-2 text-sm text-muted-foreground">
                  (click to clear)
                </span>
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
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border"
            />
            <div>
              <label htmlFor="anonymous" className="text-sm font-medium cursor-pointer">
                Post anonymously
              </label>
              <p className="text-xs text-muted-foreground">
                Your name will be hidden from other users, but administrators can still see who submitted it.
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button type="submit" disabled={submitting || !content.trim()}>
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
      </CardContent>
    </Card>
  );
}
