import { LucideIcon } from "lucide-react";
import { cn } from "~/lib/utils";

export function Feature({
  icon: Icon,
  title,
  feature,
  description,
  component,
  className,
}: {
  icon: LucideIcon;
  title: string;
  feature: string;
  description: string;
  component: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative mb-32", className)}>
      <div className="relative z-10 mb-4 pb-4 backdrop-blur-sm">
        <div className="mb-3 ml-1 flex items-center gap-2">
          <Icon className="size-4 text-orange-600" />
          <span className="font-medium text-muted-foreground text-sm md:text-base">
            {feature}
          </span>
        </div>
        <h2 className="mb-2 font-medium text-2xl md:mb-4 md:text-5xl">
          {title}
        </h2>
        <p className="text-base text-muted-foreground md:text-lg">
          {description}
        </p>
      </div>
      <div>{component}</div>
    </div>
  );
}
