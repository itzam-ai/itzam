"use client";

import { deleteResource, Knowledge } from "@itzam/server/db/knowledge/actions";
import NumberFlow from "@number-flow/react";
import { formatBytes } from "bytes-formatter";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ClockIcon,
  Download,
  ExternalLink,
  FileIcon,
  GlobeIcon,
  Loader2,
  TrashIcon,
  Worm,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";

export const KnowledgeItem = ({
  resource,
  onDelete,
}: {
  resource: Knowledge["resources"][number] & {
    totalChunks?: number;
    processedChunks?: number;
  };
  onDelete?: (resourceId: string) => void;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const fileSize = resource.fileSize ? formatBytes(resource.fileSize) : "0";

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteResource(resource.id);
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
            {(resource.status === "PENDING" ||
              (resource.processedChunks ?? 0) <
                (resource.totalChunks ?? 1)) && (
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
            {resource.status === "PROCESSED" &&
              (resource.processedChunks ?? 0) >=
                (resource.totalChunks ?? 1) && (
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
            {resource.type === "FILE" ? (
              <span className="flex items-center gap-1">
                <ClockIcon className="size-3" />
                {formatDistanceToNow(resource.createdAt, {
                  addSuffix: true,
                })}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Worm className="size-3" />
                {formatDistanceToNow(
                  resource.lastScrapedAt ?? resource.createdAt,
                  {
                    addSuffix: true,
                  }
                )}
              </span>
            )}
          </span>

          <div className="px-2 py-0.5 bg-muted rounded-sm flex font-mono items-center justify-center gap-0.5 text-xs">
            <NumberFlow
              value={resource.processedChunks ?? 0}
              style={{
                fontSize: "10px",
                fontWeight: "700",
              }}
            />
            {(resource.status === "PENDING" ||
              (resource.processedChunks ?? 0) <
                (resource.totalChunks ?? 1)) && (
              <>
                <span
                  className="text-muted-foreground font-normal"
                  style={{ fontSize: "10px" }}
                >
                  /
                </span>
                <NumberFlow
                  value={resource.totalChunks ?? 0}
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                  }}
                />
              </>
            )}
            <p
              className="text-muted-foreground ml-0.5"
              style={{
                fontSize: "10px",
              }}
            >
              chunk
              {(resource.totalChunks ?? 0) === 1 ? "" : "s"}
            </p>
          </div>

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

              {" " + (fileSize.split(" ")[1] ?? "MB")}
            </p>
          </div>
        </div>
        <div className="flex items-center">
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
