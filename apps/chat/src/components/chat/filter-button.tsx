import { cn } from "~/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export const FilterButton = ({
  onClick,
  icon,
  active,
  tooltip,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  active?: boolean;
  tooltip: string;
}) => (
  <TooltipProvider>
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "transition-all duration-200 border rounded-md p-1",
            active
              ? "border-orange-600/10 hover:border-orange-600/20 bg-orange-600/10 hover:bg-orange-600/20 text-orange-600"
              : "opacity-50",
          )}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
