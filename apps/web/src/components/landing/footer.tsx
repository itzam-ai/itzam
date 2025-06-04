import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "../ui/button";
import GitHubLogo from "public/github-logo";

export function Footer() {
  return (
    <footer className="border-t pt-10 pb-16">
      <div className="px-8 md:px-2">
        <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
          <div className="col-span-3 flex flex-col">
            <Link
              href="/"
              className="flex items-center gap-x-2 transition-opacity hover:cursor-pointer hover:opacity-80"
            >
              <Image
                unoptimized
                src="/logo.svg"
                alt="Itzam Logo"
                width={16}
                height={16}
              />
              <span className="font-semibold text-xl">Itzam</span>
            </Link>

            <p className="mt-2 text-muted-foreground text-sm">
              Seamlessly integrate AI into your applications
            </p>
            <div className="mt-4 w-fit flex gap-2 items-center">
              <ThemeToggle />
              <Link href="https://github.com/itzam-ai/itzam" target="_blank">
                <Button variant="outline" size="sm">
                  <GitHubLogo size="sm" />
                  Star us
                </Button>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-sm">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/pricing"
                  className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/roadmap"
                  className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                >
                  Roadmap
                </Link>
              </li>
              <li>
                <Link
                  href="/models"
                  className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                  prefetch={true}
                >
                  Models
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-sm">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="https://docs.itz.am"
                  target="_blank"
                  className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="https://docs.itz.am/sdks/javascript"
                  target="_blank"
                  className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                >
                  SDKs
                </Link>
              </li>
              <li>
                <Link
                  href="https://docs.itz.am/api-reference/endpoints/generate-text"
                  target="_blank"
                  className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                >
                  API Reference
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-sm">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="mailto:support@itz.am"
                  className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                >
                  Support
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  prefetch={true}
                  className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="https://cal.com/gustavo-fior/30min"
                  target="_blank"
                  className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                >
                  Call a founder
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
