"use client";

import { deleteResource, Knowledge } from "@itzam/server/db/knowledge/actions";
import NumberFlow from "@number-flow/react";
import { formatBytes } from "bytes-formatter";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Download,
  ExternalLink,
  FileIcon,
  GlobeIcon,
  Loader2,
  TrashIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";
import { ContextPopover } from "../contexts/context-popover";
import { LayersIcon } from "lucide-react";

export const KnowledgeItem = ({
  resource,
  onDelete,
  processedChunks,
  workflowId,
  contextId,
  contexts,
}: {
  resource: Knowledge["resources"][number] & { chunksLength?: number };
  onDelete?: (resourceId: string) => void;
  processedChunks?: number;
  workflowId?: string;
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
  const [isDeleting, setIsDeleting] = useState(false);
  const fileSize = resource.fileSize ? formatBytes(resource.fileSize) : "0";

  const handleDelete = async () => {
    setIsDeleting(true);
    if (contextId && workflowId) {
      // If we're in a context, remove the resource from the context
      const { updateContext } = await import("@itzam/server/actions/contexts");
      await updateContext(contextId, {
        resources: {
          remove: [resource.id],
        },
      });
    } else {
      // Otherwise, delete the resource from knowledge
      await deleteResource(resource.id);
    }
    onDelete?.(resource.id);
    setIsDeleting(false);
  };

  return (
    <motion.div key={resource.id} className="flex gap-2 items-center">
      <div className="flex justify-center items-center rounded-md bg-card p-2 border border-border">
        {resource.type === "FILE" ? (
          <FileIcon className="size-3" />
        ) : (
          <GlobeIcon className="size-3" />
        )}
      </div>
      <div className="justify-between w-full flex items-center">
        <div className="flex items-center gap-2 flex-wrap">
          <AnimatePresence mode="wait" initial={false}>
            {resource.status === "FAILED" && (
              <motion.div
                key="failed-status"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <X className="size-3 text-red-500" />
              </motion.div>
            )}
            {resource.status === "PENDING" && (
              <motion.div
                key="pending-status"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Loader2 className="size-3 text-yellow-500 animate-spin" />
              </motion.div>
            )}
            {resource.status === "PROCESSED" && (
              <motion.div
                key="processed-status"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Check className="size-3 text-green-500" />
              </motion.div>
            )}
          </AnimatePresence>

          <p className="font-medium text-xs whitespace-nowrap">
            {resource.title ? resource.title : resource.fileName}
          </p>

          <span className="text-muted-foreground text-xs whitespace-nowrap">
            {formatDistanceToNow(resource.createdAt, {
              addSuffix: true,
            })}
          </span>

          <div className="px-2 py-0.5 bg-muted rounded-sm flex font-mono items-center justify-center gap-1 text-xs">
            <NumberFlow
              value={resource.chunks?.length ?? resource.chunksLength ?? 0}
              style={{
                fontSize: "10px",
                fontWeight: "700",
              }}
            />
            <p
              className="text-muted-foreground"
              style={{
                fontSize: "10px",
              }}
            >
              chunk{(resource.chunks?.length ?? resource.chunksLength ?? 0) === 1 ? "" : "s"}
            </p>
          </div>

          {/* Progress indicator during processing */}
          {resource.status === "PENDING" && processedChunks !== undefined && (resource.chunks?.length ?? resource.chunksLength) && (
            <div className="px-2 py-0.5 bg-muted rounded-sm flex font-mono items-center justify-center gap-1 text-xs">
              <NumberFlow
                value={processedChunks}
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                }}
              />
              <span className="text-muted-foreground" style={{ fontSize: "10px" }}>/</span>
              <NumberFlow
                value={resource.chunks?.length ?? resource.chunksLength ?? 0}
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                }}
              />
              <p
                className="text-muted-foreground"
                style={{
                  fontSize: "10px",
                }}
              >
                processed
              </p>
            </div>
          )}

          <div className="px-2 py-0.5 bg-muted rounded-sm flex font-mono items-center justify-center gap-1 text-xs">
            <p
              className="text-muted-foreground whitespace-nowrap"
              style={{
                fontSize: "10px",
              }}
            >
              <NumberFlow
                value={Number(fileSize.split(" ")[0])}
                className="text-foreground"
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                }}
              />

              {" " + (fileSize.split(" ")[1] ?? "")}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          {workflowId && contexts && (
            <ContextPopover
              resourceId={resource.id}
              workflowId={workflowId}
              contexts={contexts}
              trigger={
                <Button variant="ghost" size="icon">
                  <LayersIcon className="size-3" />
                </Button>
              }
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            asChild
            disabled={!resource.url || isDeleting}
          >
            <Link
              href={resource.url ?? ""}
              target="_blank"
              rel="noopener noreferrer"
              className={`${isDeleting ? "pointer-events-none opacity-50" : ""} transition-all`}
            >
              {resource.type === "FILE" ? (
                <Download className="size-3" />
              ) : (
                <ExternalLink className="size-3" />
              )}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <TrashIcon className="size-3" />
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
