"use client";

import {
  createResources,
  deleteResource,
  Knowledge,
} from "@itzam/server/db/knowledge/actions";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, Globe, PlusIcon, TrashIcon, X } from "lucide-react";
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
  workflowId,
  knowledge,
}: {
  workflowId: string;
  knowledge: Knowledge;
}) => {
  const workflowLinks = knowledge?.resources.filter(
    (resource) => resource.type === "LINK"
  );

  const [link, setLink] = useState<string>("");
  const [linksToAdd, setLinksToAdd] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async () => {
    setIsUploading(true);
    await createResources(
      linksToAdd.map((link) => ({
        fileName: link,
        url: link,
        mimeType: "text/html",
        type: "LINK",
        fileSize: 0,
      })),
      knowledge?.id ?? "",
      workflowId
    );

    setIsUploading(false);
    setLinksToAdd([]);
    toast.success("Links added to knowledge base");
  };

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="font-medium">Links</h2>
        {workflowLinks && workflowLinks.length > 0 && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <PlusIcon className="size-3" />
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
                  onClick={() => {
                    setIsDialogOpen(false);
                    setLink("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setLinksToAdd([...linksToAdd, link]);
                    setLink("");
                    setIsDialogOpen(false);
                  }}
                >
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <AnimatePresence>
        {linksToAdd.length > 0 && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
              filter: "blur(4px)",
              marginTop: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
              filter: "blur(0px)",
              marginTop: 8,
            }}
            exit={{
              opacity: 0,
              height: 0,
              filter: "blur(4px)",
              marginTop: 0,
            }}
            transition={{ duration: 0.3 }}
            className="rounded-lg border border-border shadow-sm bg-muted-foreground/5"
          >
            <div className="flex gap-2 items-center p-2">
              <div className="flex gap-2 items-center">
                {linksToAdd.map((link) => (
                  <div
                    key={link}
                    className={`flex gap-1.5 items-center text-xs bg-muted-foreground/20 rounded-sm px-2 py-1.5 border border-muted-foreground/10 ${
                      link ? "opacity-100" : "opacity-50"
                    }`}
                  >
                    <Globe className="size-2.5" />
                    {link}
                    <X
                      className="size-2.5 hover:opacity-80 transition-opacity cursor-pointer text-red-500"
                      onClick={() =>
                        setLinksToAdd(linksToAdd.filter((l) => l !== link))
                      }
                    />
                  </div>
                ))}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleSubmit}
                className="ml-auto"
                disabled={isUploading}
              >
                <ArrowDown className="size-3" />
                Add to knowledge
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {workflowLinks && workflowLinks.length > 0 ? (
        <div className="flex flex-col gap-2 mt-2 rounded-lg border border-border shadow-sm bg-muted-foreground/5 p-2">
          {workflowLinks.map((resource) => (
            <div key={resource.id} className="flex gap-3 items-center">
              <div className="flex justify-center items-center rounded-md bg-card p-2 border border-border">
                <Globe className="size-3" />
              </div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-xs">
                  {resource.title ?? resource.url}
                </p>
                <span className="text-muted-foreground text-xs">
                  {formatDistanceToNow(resource.createdAt, {
                    addSuffix: true,
                  })}
                </span>
                {resource.status === "FAILED" && (
                  <span className="text-red-500 text-xs">Failed</span>
                )}
                {resource.status === "PENDING" && (
                  <span className="text-yellow-500 text-xs">Pending</span>
                )}
                {resource.status === "PROCESSED" && (
                  <span className="text-green-500 text-xs">Processed</span>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => deleteResource(resource.id, workflowId)}
              >
                <TrashIcon className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-16 rounded-lg border border-dashed border-border mt-2">
          <EmptyStateDetails
            title="No links added"
            description="Add links to the model's knowledge base"
            icon={<Globe className="size-4" />}
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <PlusIcon className="size-3" />
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
                  onClick={() => {
                    setIsDialogOpen(false);
                    setLink("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setLinksToAdd([...linksToAdd, link]);
                    setLink("");
                    setIsDialogOpen(false);
                  }}
                >
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};
