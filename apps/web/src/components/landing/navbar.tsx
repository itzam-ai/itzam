"use client";

import Link from "next/link";

import {
  ArrowRight,
  Blocks,
  Bot,
  Code,
  LucideIcon,
  Menu, // Added Menu icon
  Wallet,
} from "lucide-react";
import Image from "next/image";
import {
  Sheet, // Added Sheet components
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "~/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "~/components/ui/navigation-menu";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import GitHubLogo from "public/github-logo";

const features = [
  {
    icon: Bot,
    href: "/#model-prompt-hot-swap",
    label: "Model & Prompt hot swap",
    description: "Change the current model and prompt instantly.",
  },
  {
    icon: Wallet,
    href: "/#costs-usage",
    label: "Costs & Usage",
    description: "Manage AI spending and usage in one place.",
  },
  {
    icon: Blocks,
    href: "/#playground",
    label: "Playground",
    description: "Explore different models, prompts and inputsd.",
  },
  {
    icon: Code,
    href: "/#sdks-api",
    label: "SDKs & API",
    description: "AI in 3 or 4 lines of code",
  },
];

export function NavBar() {
  const { isSignedIn } = useCurrentUser();

  return (
    <>
      <div className="fixed top-4 right-0 left-0 z-50 flex justify-center px-6 xl:px-0">
        <nav className="mx-auto w-full max-w-5xl rounded-2xl border bg-card">
          <div className="grid h-16 grid-cols-3 items-center px-4"> {/* Always 3 columns */}
            {/* Logo */}
            <div className="flex items-center justify-start"> {/* Changed ml-2 to justify-start */}
              <Link href="/" className="flex items-center gap-x-2">
                <Image
                  unoptimized
                  priority
                  src="/logo.svg"
                  alt="Itzam Logo"
                  width={16}
                  height={16}
                />
                <span className="font-medium text-xl">Itzam</span>
                <Badge variant="neutral" size="sm">
                  Beta
                </Badge>
              </Link>
            </div>

            {/* Mobile Menu Trigger (Centred) & Desktop Navigation (Centred) */}
            <div className="flex justify-center items-center">
              {/* Mobile Menu Trigger */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-3/4 pt-10">
                    <div className="flex flex-col space-y-5">
                      <SheetClose asChild>
                        <Link
                          href="/pricing"
                          className="block w-full rounded-md px-3 py-2 text-lg font-medium hover:bg-accent"
                        >
                          Pricing
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/roadmap"
                          className="block w-full rounded-md px-3 py-2 text-lg font-medium hover:bg-accent"
                        >
                          Roadmap
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="https://docs.itz.am"
                          target="_blank"
                          className="block w-full rounded-md px-3 py-2 text-lg font-medium hover:bg-accent"
                        >
                          Docs
                        </Link>
                      </SheetClose>

                      <div className="pt-4">
                        <h3 className="mb-2 px-3 text-base font-semibold text-muted-foreground">
                          Features
                        </h3>
                        {features.map((feature) => (
                          <SheetClose asChild key={feature.label}>
                            <Link
                              href={feature.href}
                              className="block w-full rounded-md px-3 py-2 text-base hover:bg-accent"
                              scroll={true}
                            >
                              {feature.label}
                            </Link>
                          </SheetClose>
                        ))}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex">
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                    <NavigationMenuTrigger>Features</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="flex flex-col gap-1 p-2 pb-3 md:w-[400px] ">
                        {features.map((feature) => (
                          <FeatureItem key={feature.label} {...feature} />
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuLink
                      href="/pricing"
                      className={navigationMenuTriggerStyle()}
                    >
                      Pricing
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuLink
                      href="/roadmap"
                      className={navigationMenuTriggerStyle()}
                    >
                      Roadmap
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuLink
                      href="https://docs.itz.am"
                      target="_blank"
                      className={navigationMenuTriggerStyle()}
                    >
                      Docs
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center justify-end gap-2"> {/* Added gap-2 here for consistency */}
              <Link href="https://github.com/itzam-ai/itzam" target="_blank">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 hover:bg-transparent hover:opacity-70 transition-opacity"
                >
                  <GitHubLogo size="md" />
                </Button>
              </Link>
              {isSignedIn ? (
                <Link href="/dashboard" prefetch={true}>
                  <Button variant="secondary">
                    Dashboard
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center gap-x-2 text-sm">
                  <Link href="/auth/sign-up" prefetch={true}>
                    <Button variant="ghost">Sign Up</Button>
                  </Link>
                  <Link href="/auth/login" prefetch={true}>
                    <Button variant="primary">Login</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}

function FeatureItem({
  icon: Icon,
  href,
  label,
  description,
}: {
  icon: LucideIcon;
  href: string;
  label: string;
  description: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="flex cursor-pointer flex-col gap-1 rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground"
      aria-label={`Scroll to ${label} section`}
    >
      <Link
        href={href}
        className="flex flex-col gap-1"
        scroll={true}
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="flex items-center gap-x-2 text-sm font-medium">
          <Icon className="size-3.5 text-orange-600" />
          {label}
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </Link>
    </div>
  );
}
