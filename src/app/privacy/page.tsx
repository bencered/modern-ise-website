import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | ISE Residencies",
  description: "Privacy policy for ISE Residencies - how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Privacy Policy</h1>

        <p className="mb-6 text-sm text-muted-foreground">
          Last updated: 28 January 2025
        </p>

        <div className="space-y-8 text-neutral-700 dark:text-neutral-300">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">1. What Data We Collect</h2>
            <p className="mb-3">When you use ISE Residencies, we collect:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong>Account information:</strong> Your name and email address (from your student email)</li>
              <li><strong>Testimonials:</strong> Any testimonials you submit about residency experiences</li>
              <li><strong>Ratings:</strong> Star ratings you give to residencies</li>
              <li><strong>Company rankings:</strong> Your personal tier list rankings</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">2. How We Use Your Data</h2>
            <p className="mb-3">We use your data to:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Provide the service (display testimonials, aggregate ratings)</li>
              <li>Authenticate you as an ISE student</li>
              <li>Moderate content for abuse or policy violations</li>
              <li>Improve the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">3. Who Can Access Your Data</h2>
            <p className="mb-3">
              <strong>Administrators</strong> have access to the database and can view user data for:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Content moderation (reviewing testimonials)</li>
              <li>Investigating abuse or policy violations</li>
              <li>Technical support and debugging</li>
            </ul>
            <p className="mt-3">
              We do not access your data for any other purpose. We do not sell or share your data with third parties.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">4. Anonymous Testimonials</h2>
            <p>
              When you submit an anonymous testimonial, your name is hidden from other users. However,
              administrators can still see who submitted it for moderation purposes. If you want complete
              anonymity, do not submit a testimonial.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">5. Your Rights (GDPR)</h2>
            <p className="mb-3">Under GDPR, you have the right to:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong>Access:</strong> Download a copy of all your data</li>
              <li><strong>Erasure:</strong> Delete your account and all associated data</li>
              <li><strong>Rectification:</strong> Correct inaccurate data</li>
              <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
            </ul>
            <p className="mt-3">
              You can exercise these rights from your{" "}
              <Link href="/account" className="text-blue-600 hover:underline dark:text-blue-400">
                account settings page
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">6. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. When you delete your account,
              all your data is permanently removed from our systems. There is no backup retention period.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">7. Data Storage</h2>
            <p>
              Your data is stored on Convex, a cloud database platform. Data may be processed in the
              United States. By using this service, you consent to this transfer.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">8. Contact</h2>
            <p>
              For privacy-related questions or to exercise your rights manually, contact the site
              administrator through the ISE community channels.
            </p>
          </section>

          <section className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> This is an unofficial, student-made website. It is not affiliated
              with the University of Limerick or the ISE programme. Your use of this site is at your
              own discretion.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
