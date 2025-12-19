"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Github } from "lucide-react";

import ISE_UL_LOGO from "/public/ise-ul-logo.png";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ThemeSwapButton } from "../theming/theme-swap-button";

export function PcNavbar() {
  return (
    <div className="max-w-screen fixed z-50 hidden w-screen flex-row items-center border-b-2 border-neutral-900/20 p-3 font-mono tracking-tight backdrop-blur-sm dark:border-neutral-100/10 md:flex">
      <Link href="/">
        <Image
          src={ISE_UL_LOGO}
          width={200}
          alt="The ISE and University of Limerick logos, side-by-side."
          className="mr-6 invert dark:invert-0" />
      </Link>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Home
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <Link href="/residencies" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Residencies
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="ml-auto flex items-center gap-3">
        <ThemeSwapButton />
        <a
          href="https://github.com/bencered/modern-ise-website"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
        >
          <Github className="h-4 w-4" />
          Contribute
        </a>
      </div>
    </div>
  );
}
