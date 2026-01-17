"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { CompanyHeader } from "@/components/companies/company-header";
import { CompanyLinks } from "@/components/companies/company-links";
import { CompanyResidencies } from "@/components/companies/company-residencies";
import { CompanyTestimonials } from "@/components/companies/company-testimonials";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function CompanyPageSkeleton() {
  return (
    <main className="min-h-screen px-4 pt-24 pb-8 md:px-8 lg:px-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-start gap-6">
          <Skeleton className="h-20 w-20 rounded-xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="mt-8 space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </main>
  );
}

function CompanyNotFound() {
  return (
    <main className="min-h-screen px-4 pt-24 pb-8 md:px-8 lg:px-16">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-2xl font-bold">Company Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          The company you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button asChild className="mt-6">
          <Link href="/residencies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Residencies
          </Link>
        </Button>
      </div>
    </main>
  );
}

export default function CompanyPage() {
  const params = useParams();
  const slug = params.slug as string;

  const companyData = useQuery(api.companies.getWithResidencies, { slug });

  if (companyData === undefined) {
    return <CompanyPageSkeleton />;
  }

  if (companyData === null) {
    return <CompanyNotFound />;
  }

  return (
    <main className="min-h-screen px-4 pt-24 pb-8 md:px-8 lg:px-16">
      <div className="mx-auto max-w-4xl">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/residencies"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Residencies
          </Link>
        </div>

        {/* Company header */}
        <CompanyHeader
          name={companyData.name}
          imageUrl={companyData.imageUrl}
          industry={companyData.industry}
          headquarters={companyData.headquarters}
          residencyCount={companyData.residencies.length}
        />

        {/* External links */}
        <div className="mt-6">
          <CompanyLinks
            website={companyData.website}
            linkedinUrl={companyData.linkedinUrl}
            wikipediaUrl={companyData.wikipediaUrl}
            glassdoorUrl={companyData.glassdoorUrl}
          />
        </div>

        {/* Description */}
        {companyData.description && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-3">About</h2>
            <p className="text-muted-foreground whitespace-pre-line">
              {companyData.description}
            </p>
          </div>
        )}

        <div className="mt-8 h-px bg-border" />

        {/* Residencies */}
        <div className="mt-8">
          <CompanyResidencies
            residencies={companyData.residencies}
            companyName={companyData.name}
          />
        </div>

        <div className="mt-8 h-px bg-border" />

        {/* Testimonials */}
        <div className="mt-8">
          <CompanyTestimonials
            companyId={companyData._id}
            companyName={companyData.name}
          />
        </div>
      </div>
    </main>
  );
}
