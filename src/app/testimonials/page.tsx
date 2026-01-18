import { TestimonialsList } from "@/components/testimonials/testimonials-list";
import { preloadQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Testimonials | ISE",
  description: "Read testimonials from ISE students about their residency experiences with our industry partners.",
  openGraph: {
    title: "ISE Student Testimonials",
    description: "Read testimonials from ISE students about their residency experiences with our industry partners.",
    type: "website",
    siteName: "Immersive Software Engineering",
  },
};

export const revalidate = 300;

export default async function TestimonialsPage() {
  const preloadedTestimonials = await preloadQuery(api.testimonials.listApproved);
  const preloadedCompanies = await preloadQuery(api.residencies.listCompanies);

  return (
    <main className="min-h-screen px-4 pt-24 pb-8 md:px-8 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Student Testimonials
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Hear from ISE students about their residency experiences
          </p>
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Please note:</strong> The testimonials below represent the personal opinions and experiences of individual students. They are not endorsed by, verified by, or representative of the views of ISE, the University of Limerick, partner companies, or this website&apos;s administrators. Information provided may be subjective, outdated, or inaccurate.
            </p>
          </div>
        </div>
        <TestimonialsList
          preloadedTestimonials={preloadedTestimonials}
          preloadedCompanies={preloadedCompanies}
        />
      </div>
    </main>
  );
}
