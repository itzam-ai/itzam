"use client";

import { createResources } from "@itzam/server/db/knowledge/actions";
import { WorkflowWithKnowledge } from "@itzam/server/db/workflow/actions";
import { Globe } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import EmptyStateDetails from "../empty-state/empty-state-detais";
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
import { Input } from "../ui/input";

export const LinkInput = ({
  workflow,
}: {
  workflow: WorkflowWithKnowledge;
}) => {
  const links = workflow.knowledge.resources.filter(
    (resource) => resource.type === "LINK"
  );

  return (
    <div className="flex flex-col justify-center items-center rounded-md border border-dashed border-border p-4 pb-16">
      {links.length > 0 ? (
        <div className="flex flex-col gap-2">
          {links.map((resource) => (
            <div key={resource.id}>{resource.url}</div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 pt-16 pb-4">
          <EmptyStateDetails
            title="No links added"
            description="Add URLs to the model's knowledge base"
            icon={<Globe />}
          />
        </div>
      )}
      <LinkInputDialog workflow={workflow} />
    </div>
  );
};

const LinkInputDialog = ({ workflow }: { workflow: WorkflowWithKnowledge }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [link, setLink] = useState<string>("");

  const handleSubmit = async () => {
    setIsUploading(true);
    await createResources(
      [
        {
          fileName: link,
          url: link,
          mimeType: "text/html",
          type: "LINK",
        },
      ],
      workflow.knowledge.id,
      workflow.id
    );

    setIsUploading(false);
    setIsDialogOpen(false);
    setLink("");
    toast.success("Links added to knowledge base");
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
        >
          Add links
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add links</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Add URLs to the model&apos;s knowledge base
        </DialogDescription>
        <Input
          type="url"
          placeholder="Enter URL"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => setIsDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isUploading}
            variant="primary"
            size="sm"
            onClick={handleSubmit}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
