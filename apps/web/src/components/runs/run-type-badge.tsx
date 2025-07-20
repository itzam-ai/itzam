import { WebhookIcon } from "lucide-react";
import { cn } from "~/lib/utils";

const runTypeConfig = {
  event: {
    icon: WebhookIcon,
    label: "Event",
  },
};

export function RunTypeBadge({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const typeConfig = runTypeConfig[type as keyof typeof runTypeConfig];
  const Icon = typeConfig.icon;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="text-sm">{typeConfig.label}</span>
    </div>
  );
}
