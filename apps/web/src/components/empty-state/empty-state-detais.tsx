import React from "react";
import { cn } from "~/lib/utils";

export default function EmptyStateDetails({
  title,
  description,
  icon,
  strokeWidth = 2.5,
  className,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex flex-col items-center justify-center",
        className,
      )}
    >
      <div className="rounded-lg border border-dashed p-2 bg-card border-muted-foreground/30">
        {React.cloneElement(icon as React.ReactElement, {
          // @ts-expect-error TODO: fix typing
          strokeWidth,
          className: "size-3",
        })}
      </div>
      <h3 className="mt-2 text-center font-medium text-card-foreground dark:text-white text-sm">
        {title}
      </h3>
      <p className=" text-center text-muted-foreground text-xs mt-1 max-w-xs">
        {description}
      </p>
    </div>
  );
}
