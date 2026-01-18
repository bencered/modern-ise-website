"use client";

import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { TestimonialCard } from "@/components/testimonials/testimonial-card";
import { TestimonialForm } from "@/components/testimonials/testimonial-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, LogIn } from "lucide-react";
import Link from "next/link";

interface CompanyTestimonialsProps {
  companyId: Id<"companies">;
  companyName: string;
}

export function CompanyTestimonials({ companyId, companyName }: CompanyTestimonialsProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const testimonials = useQuery(
    api.testimonials.listByCompany,
    isAuthenticated ? { companyId } : "skip"
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Testimonials</h2>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Testimonials</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <div className="rounded-full bg-muted p-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Sign in to view testimonials</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Testimonials from students who worked at {companyName} are only visible to signed-in ISE students.
                </p>
              </div>
              <Button asChild>
                <Link href="/signin">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Testimonials</h2>

      {/* Disclaimer */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
        <p className="text-xs text-amber-800 dark:text-amber-200">
          <strong>Please note:</strong> Testimonials represent personal opinions of individual students and are not endorsed by or representative of the views of ISE, UL, {companyName}, or this website&apos;s administrators. Information may be subjective, outdated, or inaccurate.
        </p>
      </div>

      {/* Testimonial form for authenticated users */}
      <TestimonialForm companyId={companyId} companyName={companyName} />

      {/* Testimonials list */}
      {testimonials === undefined ? (
        <div className="text-muted-foreground">Loading testimonials...</div>
      ) : testimonials.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                No testimonials yet. Be the first to share your experience!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial._id}
              content={testimonial.content}
              authorName={testimonial.authorName}
              rating={testimonial.rating}
              residencyYear={testimonial.residencyYear}
              isFeatured={testimonial.isFeatured}
              createdAt={testimonial.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
