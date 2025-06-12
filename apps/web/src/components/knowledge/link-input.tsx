"use client";

import { Knowledge } from "@itzam/server/db/knowledge/actions";
import {
<<<<<<< HEAD
  ResourceUpdatePayload,
  subscribeToResourceUpdates,
=======
  subscribeToResourceUpdates,
  ResourceUpdatePayload,
>>>>>>> origin/main
} from "@itzam/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, Globe, PlusIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { v7 } from "uuid";
<<<<<<< HEAD
import { createResourceAndSendToAPI } from "~/components/knowledge/actions";
=======
>>>>>>> origin/main
import { cn } from "~/lib/utils";
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
import { KnowledgeItem } from "./knowledge-item";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { createResourceAndSendoToAPI } from "@itzam/server/db/resource/actions";

type LinkToAdd = {
  id: string;
  url: string;
  scrapeFrequency: "NEVER" | "HOURLY" | "DAILY" | "WEEKLY";
};

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const LinkInput = ({
  workflowId,
  knowledge,
  contextId,
  contexts,
}: {
  workflowId: string;
  knowledge: Knowledge;
  contextId?: string;
  contexts?: Array<{
    id: string;
    name: string;
    slug: string;
    resourceContexts?: Array<{
      resourceId: string;
    }>;
  }>;
}) => {
  const [workflowLinks, setWorkflowLinks] = useState<
    (Knowledge["resources"][number] & {
<<<<<<< HEAD
      chunksLength?: number;
      processedChunks?: number;
      totalChunks?: number;
    })[]
  >(knowledge?.resources.filter((resource) => resource.type === "LINK") ?? []);

  // Track total processed chunks for progress calculation
  const [processedChunksMap, setProcessedChunksMap] = useState<
    Record<string, number>
  >({});
=======
      processedChunks?: number;
      totalChunks?: number;
    })[]
  >(
    knowledge?.resources
      .filter((resource) => resource.type === "LINK")
      .map((resource) => ({
        ...resource,
        processedChunks: resource.chunks.length ?? 0,
        totalChunks: resource.totalChunks ?? 0,
      })) ?? []
  );
>>>>>>> origin/main

  const [link, setLink] = useState<string>("");
  const [scrapeFrequency, setScrapeFrequency] = useState<
    "NEVER" | "HOURLY" | "DAILY" | "WEEKLY"
  >("NEVER");
  const [linkError, setLinkError] = useState<string>("");
  const [linksToAdd, setLinksToAdd] = useState<LinkToAdd[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResourceDelete = (resourceId: string) => {
    setWorkflowLinks((prevLinks) =>
      prevLinks.filter((link) => link.id !== resourceId)
    );
  };

  const handleAddLink = () => {
    if (!link) {
      setLinkError("Please enter a URL");

      setTimeout(() => {
        setLinkError("");
      }, 2000);

      return;
    }

    if (!isValidUrl(link)) {
      setLinkError("Please enter a valid URL");

      setTimeout(() => {
        setLinkError("");
      }, 2000);

      return;
    }

    setLinksToAdd([...linksToAdd, { id: v7(), url: link, scrapeFrequency }]);
    setLink("");
    setScrapeFrequency("NEVER");
    setIsDialogOpen(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setLinksToAdd([]);

    const resourcesToAdd = linksToAdd.map((link) => ({
      id: link.id,
      status: "PENDING" as const,
      title: link.url,
      createdAt: new Date(),
      updatedAt: new Date(),
      url: link.url,
      fileName: link.url,
      mimeType: "text/html",
      type: "LINK" as const,
      fileSize: 0,
      knowledgeId: contextId ? null : (knowledge?.id ?? null),
      workflowId,
      active: true,
      totalChunks: 0,
      chunks: [],
      scrapeFrequency: link.scrapeFrequency,
      lastScrapedAt: null,
      totalBatches: 0,
      processedBatches: 0,
    }));

    setWorkflowLinks((prevLinks) => [...resourcesToAdd, ...prevLinks]);

    try {
      await createResourceAndSendToAPI({
        resources: resourcesToAdd,
        knowledgeId: contextId ? undefined : knowledge?.id,
        contextId: contextId,
        workflowId: workflowId,
      });
    } catch (error) {
      setWorkflowLinks((prevLinks) => {
        return prevLinks.filter(
          (link) => !linksToAdd.some((l) => l.id === link.id)
        );
      });

      toast.error((error as Error).message);
      console.error(error);
    }

    setIsSubmitting(false);
  };

  const channelId = contextId
    ? `context-${contextId}-links`
    : `knowledge-${knowledge?.id}-links`;

  useEffect(() => {
    const unsubscribe = subscribeToResourceUpdates(
      channelId,
      (payload: ResourceUpdatePayload) => {
        setWorkflowLinks((links) => {
          return links.map((link) => {
            if (link.id === payload.resourceId) {
              // Only update fields that are present in the payload (partial updates)
              const updatedLink = { ...link };

<<<<<<< HEAD
              if (payload.status !== undefined)
                updatedLink.status = payload.status;
              if (payload.title !== undefined)
                updatedLink.title = payload.title;
              if (payload.chunksLength !== undefined)
                updatedLink.chunksLength = payload.chunksLength;
              if (payload.fileSize !== undefined)
                updatedLink.fileSize = payload.fileSize;

              // Handle progress updates for processing
              if (
                payload.processedChunks !== undefined &&
                payload.totalChunks !== undefined
              ) {
                updatedLink.processedChunks = payload.processedChunks;
                updatedLink.totalChunks = payload.totalChunks;
=======
              if (
                payload.status !== undefined &&
                payload.status !== "PROCESSED"
              ) {
                updatedLink.status = payload.status;
>>>>>>> origin/main
              }
              if (payload.title !== undefined)
                updatedLink.title = payload.title;
              if (payload.fileSize !== undefined)
                updatedLink.fileSize = payload.fileSize;
              if (payload.processedChunks !== undefined) {
                updatedLink.processedChunks =
                  (updatedLink.processedChunks ?? 0) + payload.processedChunks;
                if (
                  (updatedLink.processedChunks ?? 0) >=
                  (updatedLink.totalChunks ?? 1)
                )
                  updatedLink.status = "PROCESSED";
              }
              if (
                payload.totalChunks !== undefined &&
                payload.totalChunks !== 0
              )
                updatedLink.totalChunks = payload.totalChunks;

              return updatedLink;
            }
            return link;
          });
        });
<<<<<<< HEAD
      },
      (progressPayload) => {
        // Handle processed-chunks events to accumulate progress
        setProcessedChunksMap((prev) => ({
          ...prev,
          [progressPayload.resourceId]:
            (prev[progressPayload.resourceId] || 0) +
            progressPayload.processedChunks,
        }));
=======
>>>>>>> origin/main
      }
    );

    return () => {
      unsubscribe();
    };
  }, [channelId]);

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="font-medium ml-0.5">Links</h2>
        {workflowLinks && workflowLinks.length > 0 && (
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setLink("");
                setLinkError("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <PlusIcon className="size-3" />
                Add links
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Links</DialogTitle>
                <DialogDescription>
                  Add URLs to the model&apos;s knowledge.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url" className="ml-0.5">
                    URL
                  </Label>
                  <Input
                    type="url"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddLink();
                      }
                    }}
                    className={cn(linkError ? "ring-1 ring-red-500" : "")}
                    placeholder="https://"
                    value={linkError ? linkError : link}
                    onChange={(e) => {
                      setLink(e.target.value);
                      setLinkError("");
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scrape-frequency" className="ml-0.5">
                    Scrape frequency
                  </Label>
                  <Select
                    value={scrapeFrequency}
                    onValueChange={(value) =>
                      setScrapeFrequency(
                        value as "NEVER" | "HOURLY" | "DAILY" | "WEEKLY"
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEVER">Never</SelectItem>
                      <SelectItem value="HOURLY">Hourly</SelectItem>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setLink("");
                    setLinkError("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-20"
                  onClick={handleAddLink}
                  disabled={!link}
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
              marginTop: 0,
              filter: "blur(6px)",
            }}
            animate={{
              opacity: 1,
              height: "auto",
              marginTop: 8,
              filter: "blur(0px)",
              transition: {
                opacity: { delay: 0.2 },
                marginTop: { delay: 0.2 },
                filter: { delay: 0.2 },
              },
            }}
            exit={{
              opacity: 0,
              height: 0,
              marginTop: 0,
              filter: "blur(6px)",
              transition: { height: { delay: 0.2 } },
            }}
            transition={{ duration: 0.3 }}
            className="rounded-lg border border-border shadow-sm bg-muted-foreground/5"
          >
            <div className="flex gap-2 items-center p-2 justify-between">
              <div className="flex gap-2 items-center flex-wrap">
                {linksToAdd.map((link) => (
                  <div
                    key={link.id}
                    className={`flex gap-2 items-center bg-muted-foreground/20 rounded-sm px-2 py-1.5 border border-muted-foreground/10 ${
                      link.url ? "opacity-100" : "opacity-50"
                    }`}
                  >
                    <Globe className="size-3 text-muted-foreground" />
                    <p className="text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-48 mr-0.5">
                      {link.url}
                    </p>
                    <X
                      className="size-3 hover:opacity-70 transition-opacity cursor-pointer text-muted-foreground"
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
                disabled={isSubmitting || linksToAdd.length === 0}
              >
                <ArrowDown className="size-3" />
                Add to knowledge
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!workflowLinks || workflowLinks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 rounded-lg border border-dashed border-border mt-2">
          <EmptyStateDetails
            title="No links added"
            description="Add links to the model's knowledge base"
            icon={<Globe className="size-4" />}
          />
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setLink("");
                setLinkError("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button type="button" variant="secondary" size="sm">
                <PlusIcon className="size-3" />
                Add links
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Links</DialogTitle>
                <DialogDescription>
                  Add URLs to the model&apos;s knowledge.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url" className="ml-0.5">
                    URL
                  </Label>
                  <Input
                    type="url"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddLink();
                      }
                    }}
                    className={cn(linkError ? "ring-1 ring-red-500" : "")}
                    placeholder="https://"
                    value={linkError ? linkError : link}
                    onChange={(e) => {
                      setLink(e.target.value);
                      setLinkError("");
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scrape-frequency" className="ml-0.5">
                    Scrape frequency
                  </Label>
                  <Select
                    value={scrapeFrequency}
                    onValueChange={(value) =>
                      setScrapeFrequency(
                        value as "NEVER" | "HOURLY" | "DAILY" | "WEEKLY"
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEVER">Never</SelectItem>
                      <SelectItem value="HOURLY">Hourly</SelectItem>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setLink("");
                    setLinkError("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-20"
                  onClick={handleAddLink}
                  disabled={!link}
                >
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <motion.div className="flex flex-col gap-2 mt-2 rounded-lg border border-border shadow-sm bg-muted-foreground/5 p-2">
          {workflowLinks.map((resource) => (
            <KnowledgeItem
              key={resource.id}
              resource={resource}
              onDelete={handleResourceDelete}
<<<<<<< HEAD
              processedChunks={processedChunksMap[resource.id]}
              workflowId={workflowId}
              contextId={contextId}
              contexts={contexts}
=======
>>>>>>> origin/main
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};
