import React from "react";
import { cn } from "~/lib/utils";

export default function EmptyStateDetails({
  title,
  description,
  icon,
  strokeWidth = 2,
  className,
  loading = false,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  strokeWidth?: number;
  className?: string;
  loading?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex flex-col items-center justify-center",
        className
      )}
    >
      <div className="rounded-lg border-2 border-dashed p-2">
        {React.cloneElement(icon as React.ReactElement, {
          // @ts-expect-error TODO: fix typing
          strokeWidth,
          className: loading ? "size-4 animate-spin" : "size-4",
        })}
      </div>
      <h3 className="mt-4 text-center text-xl font-medium text-card-foreground dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-center text-muted-foreground text-sm">
        {description}
      </p>
    </div>
  );
}
