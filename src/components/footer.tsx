import Link from "next/link";
import { ExternalLink } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-white font-mono dark:bg-background">
      <div className="mx-auto grid w-full max-w-screen-xl gap-x-16 gap-y-12 p-4 py-6 md:grid-cols-2 lg:grid-cols-3 lg:py-8">
        <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-1 lg:pr-20">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Disclaimer:</strong> This is an unofficial, student-made website. It is not affiliated with, endorsed by, or connected to Immersive Software Engineering, the University of Limerick, or any partner companies.
            </p>
          </div>
        </div>

        <div>
          <h3 className="pb-2 text-lg font-bold">Site</h3>
          <div className="grid grid-cols-2 text-neutral-700 dark:text-neutral-50/70 lg:grid-cols-1">
            <Link className="hover:underline" href="/residencies">Residencies</Link>
            <Link className="hover:underline" href="/testimonials">Testimonials</Link>
            <Link className="hover:underline" href="/course-details/why-choose-ise">Why Choose ISE?</Link>
          </div>
        </div>

        <div className="flex flex-col">
          <h3 className="pb-2 text-lg font-bold">ISE Location</h3>
          <span className="text-neutral-700 dark:text-neutral-50/70">Block 2</span>
          <span className="text-neutral-700 dark:text-neutral-50/70">International Business Centre</span>
          <span className="text-neutral-700 dark:text-neutral-50/70">University of Limerick</span>
          <span className="text-neutral-700 dark:text-neutral-50/70">Castletroy</span>
          <span className="text-neutral-700 dark:text-neutral-50/70">V94 Y985</span>
        </div>
      </div>
    </footer>
  );
};
