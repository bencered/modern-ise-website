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
        </div>
        <TestimonialsList
          preloadedTestimonials={preloadedTestimonials}
          preloadedCompanies={preloadedCompanies}
        />
      </div>
    </main>
  );
}
