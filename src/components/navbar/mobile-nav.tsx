import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Menu, Github } from "lucide-react";
import Link from "next/link";
import { ThemeSwapButton } from "../theming/theme-swap-button";
import { AuthStatusMobile } from "./auth-status";

export const MobileNavbar = () => {

  return (
    <Drawer>
      <div className="fixed z-50 flex w-full flex-row items-center justify-between border-b-2 border-b-neutral-900/60 px-2 py-2 backdrop-blur-sm md:hidden">
        <Link href="/" className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          ise.bence.red
        </Link>
        <div className="flex flex-row items-center gap-x-3">
          <ThemeSwapButton />
          <a
            href="https://github.com/bencered/modern-ise-website"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-full bg-green-500 p-2 text-white transition-colors hover:bg-green-600"
          >
            <Github className="h-4 w-4" />
          </a>
          <DrawerTrigger >
            <Menu />
          </DrawerTrigger>
        </div>
      </div>
      <DrawerContent className="max-h-[60svh] p-0">
        <div className="flex flex-col space-y-3 overflow-auto p-6">
          <Link href="/">Home</Link>
          <Link href="/residencies">Residencies</Link>
          <Link href="/testimonials">Testimonials</Link>
          <AuthStatusMobile />
          <a
            href="https://github.com/bencered/modern-ise-website"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-green-500"
          >
            <Github className="h-4 w-4" />
            Contribute on GitHub
          </a>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
