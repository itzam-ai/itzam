"use client";

import { deleteWorkflow } from "@itzam/server/db/workflow/actions";
import { Trash } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Spinner } from "../ui/spinner";

export function WorkflowHeader({
  name,
  description,
  workflowId,
  slug,
}: {
  name: string;
  description: string;
  workflowId: string;
  slug: string;
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [slugConfirmation, setSlugConfirmation] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteWorkflow(workflowId);
    setIsDeleting(false);
    setOpen(false);
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex max-w-[calc(100%-100px)] flex-col gap-1">
        <h1 className="font-semibold text-xl">
          {name}{" "}
          <span className="ml-1 font-normal text-muted-foreground/30 text-sm">
            {slug}
          </span>
        </h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <Dialog
        open={open}
        onOpenChange={() => {
          setOpen(!open);
          setSlugConfirmation("");
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Trash className="size-3" strokeWidth={2.5} />
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Your workflow{" "}
              <span className="font-semibold text-foreground">{name}</span> and
              all its runs will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-2">
            <p className="text-muted-foreground text-sm">
              Please enter the slug
              <span className="font-semibold text-foreground">
                {" "}
                ({slug})
              </span>{" "}
              of the workflow to confirm deletion.
            </p>
            <Input
              type="text"
              placeholder={slug}
              value={slugConfirmation}
              onChange={(e) => setSlugConfirmation(e.target.value)}
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} size="sm">
              Cancel
            </Button>
            <HoldToDeleteButton
              handleDelete={handleDelete}
              disabled={isDeleting || slugConfirmation !== slug}
            >
              {isDeleting ? <Spinner /> : "Hold to Delete"}
            </HoldToDeleteButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function HoldToDeleteButton({
  children,
  handleDelete,
  disabled,
}: {
  children: React.ReactNode;
  handleDelete: () => void;
  disabled: boolean;
}) {
  const [actionTriggered, setActionTriggered] = useState(false);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startHolding = () => {
    if (disabled) {
      return;
    }

    holdTimeoutRef.current = setTimeout(() => {
      setActionTriggered(true);
      handleDelete();
    }, 2000);
  };

  const stopHolding = () => {
    if (holdTimeoutRef.current && !actionTriggered) {
      clearTimeout(holdTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={disabled}
      className="relative w-32 overflow-hidden"
      onMouseDown={startHolding}
      onMouseUp={stopHolding}
      onMouseLeave={stopHolding}
      onTouchStart={startHolding}
      onTouchEnd={stopHolding}
      data-triggered={actionTriggered}
    >
      <div aria-hidden="true" className="hold-overlay">
        {children}
      </div>
      {children}
    </Button>
  );
}
