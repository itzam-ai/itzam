"use client";

import { Trash } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Spinner } from "../ui/spinner";
import { deleteContext } from "@itzam/server/db/contexts/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const DeleteContextButton = ({ contextId }: { contextId: string }) => {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit() {
    try {
      setIsLoading(true);
      await deleteContext(contextId);
      setIsDialogOpen(false);
      toast.success("Context deleted");
      router.refresh();
    } catch (error) {
      toast.error("Error deleting context");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash className="size-3" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="!focus:outline-none !focus:ring-0 sm:max-w-[400px]"
        style={{ outline: "none" }}
        tabIndex={-1}
      >
        <DialogHeader>
          <DialogTitle>Delete Context</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this context? This action cannot be
            undone.
          </DialogDescription>
          <DialogDescription className="text-foreground pt-4">
            All resources will be deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4">
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
            size="sm"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onSubmit}
            disabled={isLoading}
            size="sm"
            className="w-20"
          >
            {isLoading ? <Spinner /> : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
