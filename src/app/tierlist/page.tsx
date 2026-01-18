import { TierList } from "@/components/tierlist/tier-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Tier List | ISE",
  description: "Rank ISE residency companies in your personal tier list. Drag and drop to create your ultimate S-F tier ranking.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TierListPage() {
  return (
    <main className="min-h-screen px-4 pt-24 pb-8 md:px-8 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Residency Tier List
          </h1>
        </div>
        <TierList />
      </div>
    </main>
  );
}
