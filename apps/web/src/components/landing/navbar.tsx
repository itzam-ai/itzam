"use client";

import Link from "next/link";

import {
  ArrowRight,
  Blocks,
  Bot,
  Code,
  LucideIcon,
  Wallet,
} from "lucide-react";
import Image from "next/image";
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
          <div className="grid h-16 grid-cols-2 items-center px-4 md:grid-cols-3">
            <div className="ml-2 flex items-center">
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

            <div className="hidden flex-wrap md:flex md:flex-1 md:justify-center">
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

            <div className="flex gap-2 items-center justify-end">
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
