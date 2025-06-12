"use client";

import { markUserAsOnboarded } from "@itzam/server/db/auth/actions";
import { ProviderKey } from "@itzam/server/db/provider-keys/actions";
import { Provider } from "@itzam/server/db/provider/actions";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { useState } from "react";
import { IntegrationStep } from "~/components/onboard/integration-step";
import { ProvidersStep } from "~/components/onboard/providers-step";
import {
  MiniWorkflow,
  WorkflowDetailsStep,
} from "~/components/onboard/workflow-step";
import { Button } from "~/components/ui/button";

const slideTransition = {
  duration: 0.4,
  ease: "easeInOut",
};

export const Onboard = ({
  providers,
  providerKeys,
}: {
  providers: Provider[];
  providerKeys: ProviderKey[];
}) => {
  const [workflow, setWorkflow] = useState<MiniWorkflow | null>(null);
  const [invertDirection, setInvertDirection] = useState(false);

  const [step, setStep] = useState<
    "provider-keys" | "workflow-details" | "api-key"
  >("provider-keys");

  const handleNextStep = () => {
    if (step === "provider-keys") {
      setStep("workflow-details");
    } else if (step === "workflow-details") {
      setStep("api-key");
    } else if (step === "api-key") {
      redirect("/dashboard/workflows");
    }
  };

  // only previous step is from 2 -> 1
  const handlePreviousStep = () => {
    setInvertDirection(true);

    setTimeout(() => {
      setStep("provider-keys");

      setInvertDirection(false);
    }, 100);
  };

  const handleFinishOnboarding = async () => {
    await markUserAsOnboarded();
    redirect("/dashboard/workflows");
  };

  return (
    <div className="bg-sidebar dark:bg-card min-h-screen flex flex-col">
      <div className="flex justify-center pt-8 pb-16">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={16}
            height={16}
            className="size-3"
          />
          <p className={`text-foreground font-medium`}>Itzam</p>
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center px-4">
        <AnimatePresence mode="wait">
          {step === "provider-keys" && (
            <motion.div
              key="provider-keys"
              initial={{ opacity: 0, x: "0%" }}
              animate={{ opacity: 1, x: "0%" }}
              exit={{ opacity: 0, x: "-10%" }}
              transition={slideTransition}
              className="max-w-xl w-full"
            >
              <ProvidersStep
                handleNextStep={handleNextStep}
                providers={providers}
                providerKeys={providerKeys}
              />
            </motion.div>
          )}
          {step === "workflow-details" && (
            <motion.div
              key="workflow-details"
              initial={{ opacity: 0, x: "10%" }}
              animate={{ opacity: 1, x: "0%" }}
              exit={{ opacity: 0, x: invertDirection ? "10%" : "-10%" }}
              transition={slideTransition}
              className="max-w-xl w-full"
            >
              <WorkflowDetailsStep
                handleNextStep={handleNextStep}
                handlePreviousStep={handlePreviousStep}
                setWorkflow={setWorkflow}
                providerKeys={providerKeys}
              />
            </motion.div>
          )}
          {step === "api-key" && (
            <motion.div
              key="api-key"
              initial={{ opacity: 0, x: "10%" }}
              animate={{ opacity: 1, x: "0%" }}
              transition={slideTransition}
              className="max-w-xl w-full"
            >
              <IntegrationStep
                handleNextStep={handleNextStep}
                workflow={workflow}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-center pb-8 pt-16">
        <Button variant="ghost" size="sm" onClick={handleFinishOnboarding}>
          Skip onboarding <ChevronRight className="size-3" strokeWidth={2.5} />
        </Button>
      </div>
    </div>
  );
};
