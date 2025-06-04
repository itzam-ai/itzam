"use client";

import { Computer, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-x-1 rounded-lg border bg-background p-1 h-8">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "size-6 rounded-md",
          theme === "light" && "bg-white shadow-sm"
        )}
        onClick={() => setTheme("light")}
        aria-label="Light theme"
      >
        <Sun className="size-3" />
        <span className="sr-only">Light theme</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "size-6 rounded-md",
          theme === "dark" && "bg-white/10 shadow-sm"
        )}
        onClick={() => setTheme("dark")}
        aria-label="Dark theme"
      >
        <Moon className="size-3" />
        <span className="sr-only">Dark theme</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "size-6 rounded-md",
          theme === "system" && "bg-white/50 shadow-sm dark:bg-white/10"
        )}
        onClick={() => setTheme("system")}
        aria-label="System theme"
      >
        <Computer className="size-3" />
        <span className="sr-only">System theme</span>
      </Button>
    </div>
  );
}
