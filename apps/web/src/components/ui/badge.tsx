import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        orange:
          "bg-orange-100 text-orange-600 border-orange-300 dark:bg-orange-900/20 dark:text-orange-600 dark:border-orange-800",
        red: "bg-red-100 text-red-600 border-red-300 dark:bg-red-900/20 dark:text-red-600 dark:border-red-800",
        green:
          "bg-green-100 text-green-600 border-green-300 dark:bg-green-900/20 dark:text-green-600 dark:border-green-800",
        blue: "bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-900/20 dark:text-blue-600 dark:border-blue-800",
        yellow:
          "bg-yellow-100 text-yellow-600 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-600 dark:border-yellow-800",
        purple:
          "bg-purple-100 text-purple-600 border-purple-300 dark:bg-purple-900/20 dark:text-purple-600 dark:border-purple-800",
        pink: "bg-pink-100 text-pink-600 border-pink-300 dark:bg-pink-900/20 dark:text-pink-600 dark:border-pink-800",
        gray: "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-900/20 dark:text-gray-600 dark:border-gray-800",
        emerald:
          "bg-emerald-100 text-emerald-600 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-600 dark:border-emerald-800",
        fuchsia:
          "bg-fuchsia-100 text-fuchsia-600 border-fuchsia-300 dark:bg-fuchsia-900/20 dark:text-fuchsia-600 dark:border-fuchsia-800",
        rose: "bg-rose-100 text-rose-600 border-rose-300 dark:bg-rose-900/20 dark:text-rose-600 dark:border-rose-800",
        sky: "bg-sky-100 text-sky-600 border-sky-300 dark:bg-sky-900/20 dark:text-sky-600 dark:border-sky-800",
        lime: "bg-lime-100 text-lime-600 border-lime-300 dark:bg-lime-900/20 dark:text-lime-600 dark:border-lime-800",
        cyan: "bg-cyan-100 text-cyan-600 border-cyan-300 dark:bg-cyan-900/20 dark:text-cyan-600 dark:border-cyan-800",
        violet:
          "bg-violet-100 text-violet-600 border-violet-300 dark:bg-violet-900/20 dark:text-violet-600 dark:border-violet-800",
        amber:
          "bg-amber-100 text-amber-600 border-amber-300 dark:bg-amber-900/20 dark:text-amber-600 dark:border-amber-800",
        zinc: "bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-900/20 dark:text-zinc-600 dark:border-zinc-800",
        neutral:
          "bg-neutral-100 text-neutral-600 border-neutral-300 dark:bg-neutral-900/20 dark:text-neutral-600 dark:border-neutral-800",
        stone:
          "bg-stone-100 text-stone-600 border-stone-300 dark:bg-stone-900/20 dark:text-stone-600 dark:border-stone-800",
        outline:
          "bg-transparent text-muted-foreground border-muted-foreground dark:text-muted-foreground dark:border-muted-foreground",
        foreground:
          "bg-transparent text-foreground border-foreground/80 dark:text-foreground dark:border-foreground/80",
      },
      size: {
        xs: "h-3 px-1 py-0 text-[8px]",
        sm: "h-4 px-1.5 py-1 text-[10px]",
        md: "h-5 px-2 py-1.5 text-[12px]",
        lg: "h-6 px-2.5 py-2 text-[12px]",
      },
    },
    defaultVariants: {
      variant: "orange",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}
