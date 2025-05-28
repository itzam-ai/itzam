"use client";

import { syncPlaygroundChangesToWorkflow } from "@itzam/server/db/workflow/actions";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Spinner } from "../ui/spinner";
import { motion } from "framer-motion";

export function SyncChangesToWorkflow({
  workflowId,
  modelId,
  prompt,
  enabled,
  onSuccess,
}: {
  workflowId: string;
  modelId: string;
  prompt: string;
  enabled: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function onSubmit() {
    try {
      setIsLoading(true);
      await syncPlaygroundChangesToWorkflow(workflowId, modelId, prompt);
      toast.success("Changes synced to workflow");
      setOpen(false);
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error("Error syncing changes to workflow");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <motion.div
                initial={{
                  opacity: 0,
                  filter: "blur(4px)",
                  width: 0,
                  x: -10,
                  marginRight: 0,
                }}
                animate={{
                  opacity: 1,
                  filter: "blur(0px)",
                  width: "auto",
                  x: 0,
                  marginRight: "8px",
                }}
                exit={{
                  opacity: 0,
                  filter: "blur(4px)",
                  width: 0,
                  x: -10,
                  marginRight: 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!enabled}
                  className="px-8"
                >
                  <Save className="size-3" />
                  <span className="hidden sm:inline">Sync</span>
                  <span className="sm:hidden">Sync</span>
                </Button>
              </motion.div>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Update model and prompt in workflow</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sync Changes to Workflow</DialogTitle>
          <DialogDescription>
            This will change the current prompt and model of the workflow.
          </DialogDescription>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                variant="primary"
                onClick={onSubmit}
                disabled={isLoading}
                className="w-20"
                size="sm"
              >
                {isLoading ? <Spinner /> : "Sync"}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
