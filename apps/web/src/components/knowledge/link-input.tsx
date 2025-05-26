"use client";

import { Chunk } from "@itzam/server/ai/embeddings";
import { checkPlanLimits, Knowledge } from "@itzam/server/db/knowledge/actions";
import { subscribeToChannel, supabase } from "@itzam/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, Globe, PlusIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { v7 } from "uuid";
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
import { toast } from "sonner";

type LinkToAdd = {
  id: string;
  url: string;
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
}: {
  workflowId: string;
  knowledge: Knowledge;
}) => {
  const [workflowLinks, setWorkflowLinks] = useState<Knowledge["resources"]>(
    knowledge?.resources.filter((resource) => resource.type === "LINK") ?? []
  );

  const [link, setLink] = useState<string>("");
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

    setLinksToAdd([...linksToAdd, { id: v7(), url: link }]);
    setLink("");
    setIsDialogOpen(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setLinksToAdd([]);

    setWorkflowLinks((prevLinks) => {
      return prevLinks.concat(
        linksToAdd.map((link) => ({
          id: link.id,
          status: "PENDING",
          title: link.url,
          createdAt: new Date(),
          updatedAt: new Date(),
          url: link.url,
          fileName: link.url,
          mimeType: "text/html",
          type: "LINK",
          fileSize: 0,
          knowledgeId: knowledge?.id ?? "",
          workflowId,
          active: true,
          chunks: [],
        }))
      );
    });

    try {
      await checkPlanLimits(
        linksToAdd.map((link) => ({
          fileName: link.url,
          url: link.url,
          mimeType: "text/html",
        })),
        knowledge?.id ?? ""
      );

      supabase.functions.invoke("create-knowledge-resource", {
        body: JSON.stringify({
          resources: linksToAdd.map((link) => ({
            fileName: link.url,
            url: link.url,
            mimeType: "text/html",
            type: "LINK",
            fileSize: 0,
            id: link.id,
          })),
          knowledgeId: knowledge?.id ?? "",
          workflowId: workflowId,
        }),
      });
    } catch (error) {
      toast.error((error as Error).message);
      console.error(error);
    }

    setWorkflowLinks((prevLinks) => {
      return prevLinks.filter(
        (link) => !linksToAdd.some((l) => l.id === link.id)
      );
    });

    setIsSubmitting(false);
  };

  const channelId = `knowledge-${knowledge?.id}-links`;

  useEffect(() => {
    const unsubscribe = subscribeToChannel(
      channelId,
      (payload: {
        status: "FAILED" | "PENDING" | "PROCESSED";
        resourceId: string;
        title: string;
        chunks: Chunk[];
      }) => {
        setWorkflowLinks((links) => {
          return links.map((link) => {
            if (link.id === payload.resourceId) {
              return {
                ...link,
                status: payload.status,
                title: payload.title,
                chunks: payload.chunks,
              };
            }
            return link;
          });
        });
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
                <DialogTitle>Add links</DialogTitle>
                <DialogDescription>
                  Add URLs to the model&apos;s knowledge base
                </DialogDescription>
              </DialogHeader>

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
                    <Globe className="size-3" />
                    <p className="text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-48">
                      {link.url}
                    </p>
                    <X
                      className="size-3 hover:opacity-70 transition-opacity cursor-pointer text-red-500"
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
                <DialogTitle>Add links</DialogTitle>
                <DialogDescription>
                  Add URLs to the model&apos;s knowledge base
                </DialogDescription>
              </DialogHeader>

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
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};
