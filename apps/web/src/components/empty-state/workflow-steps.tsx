"use client";
import { Workflow } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import EmptyStateDetails from "./empty-state-detais";

export const WorkflowsEmptyState = ({
  userHasNoModelAvailable,
}: {
  userHasNoModelAvailable: boolean;
}) => {
  //   const [activeStep, setActiveStep] = useState(1);

  //   useEffect(() => {
  //     const interval = setInterval(() => {
  //       setActiveStep((current) => (current % 3) + 1);
  //     }, 5000);

  //     return () => clearInterval(interval);
  //   }, []);

  return (
    <div className="rounded-lg border py-24">
      <EmptyStateDetails
        title={
          userHasNoModelAvailable ? "No models available" : "No workflows yet"
        }
        description={
          userHasNoModelAvailable
            ? "Add an Provider Key to get started"
            : "Create a workflow to use AI in your application"
        }
        icon={<Workflow />}
      />

      {userHasNoModelAvailable && (
        <div className="flex justify-center mt-6">
          <Link href="/dashboard/providers">
            <Button size="sm" variant="secondary">
              Add Provider Key
            </Button>
          </Link>
        </div>
      )}

      {/* <div className="flex flex-col gap-2 mt-12 mb-24 mx-auto items-center justify-center">
        <div className="flex gap-8 items-start">
          <WorkflowStep
            step={1}
            isActive={activeStep === 1}
            title="Create Workflow"
            description="Set up your workflow configuration"
            icon={<Workflow className="size-4" />}
          />
          <ArrowRight className="size-4 text-muted-foreground mt-3" />
          <WorkflowStep
            step={2}
            isActive={activeStep === 2}
            title="Add Steps"
            description="Configure your AI pipeline"
            icon={<Workflow className="size-4" />}
          />
          <ArrowRight className="size-4 text-muted-foreground mt-3" />
          <WorkflowStep
            step={3}
            isActive={activeStep === 3}
            title="Deploy"
            description="Make it available to your users"
            icon={<Workflow className="size-4" />}
          />
        </div>
      </div> */}
    </div>
  );
};

interface WorkflowStepProps {
  step: number;
  isActive: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const WorkflowStep = ({
  step,
  isActive,
  title,
  description,
  icon,
}: WorkflowStepProps) => {
  return (
    <div className="flex flex-col gap-2 w-32">
      <div
        className={`flex items-center transition-colors duration-200 ${
          isActive ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        <div className="font-medium text-sm">#{step}</div>
        <div className="font-medium text-sm ml-1"> {title}</div>
      </div>
      <div className="flex flex-col items-center text-center gap-1">
        <div className="text-xs text-muted-foreground">{description}</div>
        <div
          className={`mt-1 transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-50"}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};
