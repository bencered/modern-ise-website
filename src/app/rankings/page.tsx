import { CompanyRankingList } from "@/components/rankings/company-ranking-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Rankings | ISE",
  description:
    "Rank ISE residency companies in order of preference. Create your personal 1-N rankings across different residency categories.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RankingsPage() {
  return (
    <main className="min-h-screen px-4 pt-24 pb-8 md:px-8 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Company Rankings
          </h1>
          <p className="mt-3 text-muted-foreground">
            Drag and drop to rank companies in order of preference
          </p>
        </div>
        <CompanyRankingList />
      </div>
    </main>
  );
}
