"use client";

import { Lock } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";

export function UsagePeriodSelector({
  currentPeriod,
  onPeriodChange,
  plan,
}: {
  currentPeriod: 7 | 30 | 90;
  onPeriodChange: (period: 7 | 30 | 90) => void;
  plan: "hobby" | "basic" | "pro" | null;
}) {
  const router = useRouter();

  const handlePeriodChange = (value: string) => {
    onPeriodChange(Number(value) as 7 | 30 | 90);
  };

  return (
    <div className="flex items-center gap-2">
      <motion.button
        key={7}
        onClick={() => handlePeriodChange("7")}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors hover:text-primary ${
          7 === currentPeriod
            ? "rounded-md text-foreground"
            : "text-muted-foreground"
        }`}
      >
        <p className="text-xs">7 days</p>
        {7 === currentPeriod && (
          <motion.div
            layoutId="underline-settings"
            id="underline"
            className="absolute bottom-0 left-0 h-full w-full rounded-md bg-primary/10"
          />
        )}
      </motion.button>
      <motion.button
        key={30}
        onClick={() => {
          if (plan === "pro") {
            handlePeriodChange("30");
          } else {
            router.push("/dashboard/settings");
          }
        }}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors hover:text-primary ${
          30 === currentPeriod
            ? "rounded-md text-foreground"
            : "text-muted-foreground"
        }`}
      >
        <p className="text-xs flex items-center gap-1">
          {plan !== "pro" && plan !== "basic" && <Lock className="size-3" />}
          30 days
        </p>
        {30 === currentPeriod && (
          <motion.div
            layoutId="underline-settings"
            id="underline"
            className="absolute bottom-0 left-0 h-full w-full rounded-md bg-primary/10"
          />
        )}
      </motion.button>
      <motion.button
        key={90}
        onClick={() => {
          if (plan === "pro") {
            handlePeriodChange("90");
          } else {
            router.push("/dashboard/settings");
          }
        }}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors hover:text-primary ${
          90 === currentPeriod
            ? "rounded-md text-foreground"
            : "text-muted-foreground"
        }`}
      >
        <p className="flex items-center gap-1 text-xs">
          {plan !== "pro" && <Lock className="size-3" />}
          90 days
        </p>
        {90 === currentPeriod && (
          <motion.div
            layoutId="underline-settings"
            id="underline"
            className="absolute bottom-0 left-0 h-full w-full rounded-md bg-primary/10"
          />
        )}
      </motion.button>
    </div>
  );
}
