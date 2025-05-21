"use client";

import { createCheckoutSession } from "@itzam/server/db/billing/actions";
import confetti from "canvas-confetti";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { proFeatures } from "~/lib/features";
import { formatStripeValue } from "~/lib/utils";
import { PricingCard } from "../landing/pricing-table";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Switch } from "../ui/switch";

export function Plan({
  prices,
}: {
  prices: {
    id: string;
    lookup_key: string;
    unit_amount: number;
    monthly_amount: number | null;
  }[];
}) {
  const router = useRouter();

  const monthlyPrice = prices.find(
    (price) => price.lookup_key === "pro_monthly"
  );

  const yearlyPrice = prices.find((price) => price.lookup_key === "pro_yearly");

  const [currentPrice, setCurrentPrice] = useState(yearlyPrice);

  return (
    <Card>
      <PricingCard
        title="Pro"
        price={`$${formatStripeValue(currentPrice?.monthly_amount ?? 0)}`}
        priceSuffix="/month"
        features={proFeatures}
        setting={
          <div className="flex items-center gap-3">
            <Switch
              checked={currentPrice?.lookup_key === "pro_yearly"}
              onCheckedChange={() =>
                setCurrentPrice(
                  currentPrice?.lookup_key === "pro_yearly"
                    ? monthlyPrice
                    : yearlyPrice
                )
              }
              onClick={(e) => {
                if (currentPrice?.lookup_key === "pro_monthly") {
                  handleConfetti(e);
                }
              }}
            />

            <p className="text-sm">Billed yearly</p>
          </div>
        }
        button={
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={async () => {
              const session = await createCheckoutSession(
                currentPrice?.id ?? ""
              );

              if ("error" in session) {
                console.error(session.error);
                return;
              }

              if (session.url) {
                router.push(session.url);
              }
            }}
          >
            Subscribe
            <ArrowRight className="hidden size-4 md:block" />
          </Button>
        }
      />
    </Card>
  );
}

const handleConfetti = async (event: React.MouseEvent<HTMLButtonElement>) => {
  try {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    await confetti({
      origin: {
        x: x / window.innerWidth,
        y: y / window.innerHeight,
      },
      particleCount: 100,
      spread: 70,
      startVelocity: 25,
    });
  } catch (error) {
    console.error("Confetti button error:", error);
  }
};
