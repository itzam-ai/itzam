"use client";

import { Footer } from "~/components/landing/footer";
import { NavBar } from "~/components/landing/navbar";
import { PricingTable } from "~/components/landing/pricing-table";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { CTA } from "~/components/landing/cta";

export default function Pricing() {
  const { isSignedIn } = useCurrentUser();

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-between bg-background px-6 xl:px-0">
      <NavBar />

      <div className="mx-auto w-full max-w-5xl pt-40 pb-32">
        <PricingTable isSignedIn={isSignedIn} />

        <div className="mt-20 flex flex-col items-center justify-center">
          <h3 className="font-semibold text-xl">Need something else?</h3>
          <Button asChild className="group mt-4" variant="secondary">
            <Link href="https://cal.com/gustavo-fior/30min" target="_blank">
              Talk to a Founder
              <ArrowRight className="hidden size-4 transition-transform group-hover:translate-x-1 md:block" />
            </Link>
          </Button>
        </div>
      </div>

      <section id="cta" className="md:pt-24 pt-0 pb-16 md:pb-24">
        <CTA />
      </section>

      <Footer />
    </div>
  );
}
