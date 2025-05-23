import { cn } from "~/lib/utils";
import { RunOriginType, getRunOriginConfig } from "~/lib/mappers/run-origin";

interface RunOriginBadgeProps {
  origin: RunOriginType;
  className?: string;
}

export function RunOriginBadge({ origin, className }: RunOriginBadgeProps) {
  const originConfig = getRunOriginConfig(origin);
  const Icon = originConfig.icon;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="text-sm">{originConfig.label}</span>
    </div>
  );
}
