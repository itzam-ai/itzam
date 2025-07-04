import confetti from "canvas-confetti";
import { ArrowRight, LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  enterpriseFeatures,
  basicFeatures,
  standardFeatures,
  proFeatures,
} from "~/lib/features";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Switch } from "../ui/switch";
export function PricingTable({ isSignedIn }: { isSignedIn: boolean }) {
  const [billedYearly, setBilledYearly] = useState(true);

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

  return (
    <div className="relative flex flex-col justify-center">
      <div className="flex w-full rounded-xl bg-muted/50 shadow-sm md:flex-row flex-col md:gap-0 gap-4">
        <div className="w-full md:w-1/4">
          <PricingCard
            title="Hobby"
            setting={
              <p className="text-muted-foreground text-sm">Free forever</p>
            }
            price="Free"
            features={standardFeatures}
            button={
              <Link
                href={`${isSignedIn ? "/dashboard" : "/auth/login"}`}
                className="block w-full"
              >
                <Button variant="primary" className="w-full" size="sm">
                  Start Building
                  <ArrowRight className="hidden size-4 md:block" />
                </Button>
              </Link>
            }
          />
        </div>

        <div className="w-full md:w-1/4">
          <PricingCard
            title="Basic"
            setting={
              <div className="flex items-center gap-3">
                <Switch
                  checked={billedYearly}
                  onCheckedChange={() => setBilledYearly(!billedYearly)}
                  onClick={(e) => {
                    if (!billedYearly) {
                      handleConfetti(e);
                    }
                  }}
                />

                <p className="text-sm">Billed yearly</p>
              </div>
            }
            price={`$${billedYearly ? 8 : 10}`}
            priceSuffix={"/month"}
            features={basicFeatures}
            button={
              <Link
                href={`${isSignedIn ? "/dashboard/settings" : "/auth/login"}`}
                className="w-full"
              >
                <Button variant="primary" className="w-full" size="sm">
                  Start Building
                  <ArrowRight className="hidden size-4 md:block" />
                </Button>
              </Link>
            }
          />
        </div>
        <Card className="w-full md:w-1/4">
          <PricingCard
            title="Pro"
            setting={
              <div className="flex items-center gap-3">
                <Switch
                  checked={billedYearly}
                  onCheckedChange={() => setBilledYearly(!billedYearly)}
                  onClick={(e) => {
                    if (!billedYearly) {
                      handleConfetti(e);
                    }
                  }}
                />

                <p className="text-sm">Billed yearly</p>
              </div>
            }
            price={`$${billedYearly ? 16 : 20}`}
            priceSuffix="/month"
            features={proFeatures}
            button={
              isSignedIn ? (
                <Link href="/dashboard/settings" className="w-full">
                  <Button variant="primary" className="w-full" size="sm">
                    Start Building
                    <ArrowRight className="hidden size-4 md:block" />
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/login" className="w-full">
                  <Button variant="primary" className="w-full" size="sm">
                    Start Building
                    <ArrowRight className="hidden size-4 md:block" />
                  </Button>
                </Link>
              )
            }
          />
        </Card>

        <div className="w-full md:w-1/4">
          <PricingCard
            title="Enterprise"
            setting={
              <p className="text-muted-foreground text-sm">For large teams</p>
            }
            price="Contact us"
            features={enterpriseFeatures}
            button={
              <Link href="mailto:founders@itz.am" className="block w-full">
                <Button variant="secondary" className="w-full" size="sm">
                  Contact us
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    </div>
  );
}

export const PricingCard = ({
  title,
  setting,
  price,
  priceSuffix,
  features,
  button,
}: {
  title: string;
  setting: React.ReactNode;
  price: string;
  priceSuffix?: string;
  features: {
    icon: LucideIcon | null;
    text: string;
  }[];
  button: React.ReactNode;
}) => {
  return (
    <div className="z-30 flex flex-col p-6 h-full">
      <div className="flex h-full flex-col">
        <h2 className={cn(title === "Pro" && "text-orange-500 font-semibold")}>
          {title}
        </h2>
        <p className="font-semibold text-3xl mt-2 mb-4">
          {price}
          {priceSuffix && (
            <span className="text-sm text-muted-foreground ml-1 font-normal ">
              {priceSuffix}
            </span>
          )}
        </p>

        <div className="py-4 border-t border-b">{setting}</div>

        <div className="mt-4 flex flex-col items-start gap-3 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`flex items-center gap-2.5 ${
                feature.icon ? "ml-1" : ""
              }`}
            >
              {feature.icon && <feature.icon className="size-3.5" />}
              <p className="text-neutral-500 text-sm">{feature.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto w-full">{button}</div>
      </div>
    </div>
  );
};
