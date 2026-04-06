import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import {
  maintenanceModeEnabled,
  maintenanceModeLabel,
  maintenanceModeNotice,
} from "@itzam/utils/maintenance";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

export function MaintenanceBanner() {
  if (!maintenanceModeEnabled) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pt-24 xl:px-0">
      <div className="rounded-3xl border border-amber-300/60 bg-amber-50/90 p-4 shadow-sm shadow-amber-200/40 backdrop-blur dark:border-amber-900/60 dark:bg-amber-950/40 dark:shadow-none md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-200">
              <ShieldAlert className="size-5" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="amber" size="sm">
                  {maintenanceModeLabel}
                </Badge>
                <p className="font-medium text-amber-950 dark:text-amber-50">
                  Itzam is temporarily paused.
                </p>
              </div>

              <p className="max-w-2xl text-sm leading-6 text-amber-900/80 dark:text-amber-100/80">
                {maintenanceModeNotice}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="https://docs.itz.am" target="_blank">
              <Button variant="secondary" size="sm">
                Read docs
              </Button>
            </Link>
            <Link href="/roadmap">
              <Button variant="ghost" size="sm">
                See roadmap
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
