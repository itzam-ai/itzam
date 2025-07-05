"use client";

import { Blocks, Bot, Code, Wallet } from "lucide-react";
import { CTA } from "~/components/landing/cta";
import { EasySDKAPI } from "~/components/landing/easy-sdk-api";
import { Feature } from "~/components/landing/feature";

import { Footer } from "~/components/landing/footer";
import { Hero } from "~/components/landing/hero";
import { ModelHotSwap } from "~/components/landing/model-hot-swap";
import { NavBar } from "~/components/landing/navbar";
import { PlaygroundCard } from "~/components/landing/playground";
import { Providers } from "~/components/landing/providers";
import { UnifiedBillingCard } from "~/components/landing/unified-billing";
export default function Home() {
  // const { isSignedIn } = useCurrentUser();

  return (
    <div className="mx-auto min-h-screen bg-background px-6 xl:px-0">
      {/* Navigation Bar */}
      <NavBar />
      {/* Hero Section */}
      <Hero />

      <div className="max-w-4xl mx-auto">
        {/* Providers Section */}
        <Providers />
        {/* Model Hot Swap Section */}
        <section id="model-prompt-hot-swap" className="border-t pt-24">
          <Feature
            icon={Bot}
            title="New model? No problem"
            feature="Model & Prompt hot swap"
            description="Change the current model and prompt instantly."
            component={<ModelHotSwap />}
          />
        </section>
        {/* Unified Billing Section */}
        <section id="costs-usage" className="border-t pt-24">
          <Feature
            icon={Wallet}
            title="Spend less on AI"
            feature="Costs & Usage"
            description="Manage all your AI spending and usage in one place."
            component={<UnifiedBillingCard />}
          />
        </section>
        {/* Playground Section */}
        <section id="playground" className="border-t pt-24">
          <Feature
            icon={Blocks}
            title="Wanna try different prompts?"
            feature="Playground"
            description="Explore different models, prompts and inputs in the playground."
            component={<PlaygroundCard />}
          />
        </section>
        {/* SDKs & API Section */}
        <section id="sdks-api" className="border-t pt-24">
          <Feature
            icon={Code}
            title="Only 4 lines of code"
            feature="SDKs & API"
            description="Access 30+ AI models with a beautiful SDK."
            component={<EasySDKAPI />}
          />
        </section>
        {/* Pricing Section */}
        {/* <section id="pricing" className="border-t pt-24">
          <Feature
            icon={CreditCard}
            title="Free to start"
            feature="Pricing"
            description="Powerful features, no hidden costs."
            component={<PricingTable isSignedIn={isSignedIn} />}
          />
        </section> */}

        {/* CTA */}
        <section id="cta" className="md:pt-24 pt-0 pb-16 md:pb-24">
          <CTA />
        </section>
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
