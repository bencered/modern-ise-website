import AnimatedHeroText from "@/components/animated-hero";
import { NiceLink } from "@/components/ui/nice-link";
import { School } from "lucide-react";

export default function Home() {
	return (
		<div className="flex w-screen flex-col px-8 pt-12 md:pt-16">
			<AnimatedHeroText text="Why Choose ISE?" emphasis={[11, 12, 13]} />

			<h2 className="w-3/4 pt-3 font-mono text-gray-800 dark:text-neutral-300 lg:pt-0">
				In Immersive Software Engineering you’ll work with top professors, in beautiful facilities, with world-class companies, learning much more than in a traditional programme.
			</h2>

			<NiceLink size="xl" className="group font-mono" href="https://software-engineering.ie/schools/">
				<School size={24} className="min-h-5 min-w-5 transition-all duration-100 group-hover:scale-110" />
				Book an ISE visit to your school
			</NiceLink>

			<div className="max-w-screen flex flex-col gap-16 py-16 md:flex-row">
				<div className="flex h-fit basis-1/3 flex-col bg-background p-4">
					<h2 className="text-3xl">Get a master&apos;s degree in four years</h2>
					<p>Not the usual five (or six).</p>
				</div>

				<div className="flex h-fit basis-1/3 flex-col bg-background p-4">
					<h2 className="text-3xl">Spend 40 weeks every year learning</h2>
					<p>Not the usual 24. Each year of ISE will be chock-full of learning.</p>
				</div>

				<div className="flex h-fit basis-1/3 flex-col bg-background p-4">
					<h2 className="text-3xl">Learn from the best</h2>
					<p>You’ll spend half of your time in paid placements we call residencies in world-leading companies. The other half you’ll spend with brilliant researchers and lecturers at UL.</p>
				</div>
			</div>
		</div>
	);
}
