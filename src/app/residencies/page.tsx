import { ResidencyList } from "@/components/residencies/residency-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Residency Positions | ISE",
  description: "Browse open residency positions from our industry partners. Find R1, R2, R3, and R4 opportunities with top companies in software engineering.",
  openGraph: {
    title: "ISE Residency Positions",
    description: "Browse open residency positions from our industry partners. Find opportunities with top companies in software engineering.",
    type: "website",
    siteName: "Immersive Software Engineering",
  },
  twitter: {
    card: "summary_large_image",
    title: "ISE Residency Positions",
    description: "Browse open residency positions from our industry partners. Find opportunities with top companies in software engineering.",
  },
};

export default function ResidenciesPage() {
  return (
    <main className="min-h-screen px-4 pt-24 pb-8 md:px-8 lg:px-16">
      <div className="mx-auto max-w-8xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Residency Positions
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Browse open positions from our industry partners
          </p>
        </div>
        <ResidencyList />
      </div>
    </main>
  );
}
