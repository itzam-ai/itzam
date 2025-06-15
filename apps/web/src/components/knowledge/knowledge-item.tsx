"use client";

import { deleteResource, Knowledge } from "@itzam/server/db/knowledge/actions";
import {
  rescrapeResource,
  updateRescrapeFrequency,
} from "@itzam/server/db/resource/actions";
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
  RefreshCw,
  Settings,
  TrashIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { TextLoop } from "./text-loop";

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
  const [isUpdatingRescrapeFrequency, setIsUpdatingRescrapeFrequency] =
    useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRescraping, setIsRescraping] = useState(false);
  const [scrapeFrequency, setScrapeFrequency] = useState<
    "NEVER" | "HOURLY" | "DAILY" | "WEEKLY"
  >(resource.scrapeFrequency ?? "NEVER");
  const fileSize = resource.fileSize ? formatBytes(resource.fileSize) : "0";
  const [fileTitle, setFileTitle] = useState(
    resource.title ?? (resource.fileName as string)
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteResource(resource.id);
    onDelete?.(resource.id);
    setIsDeleting(false);
  };

  const handleUpdateRescrapeFrequency = async (
    frequency: "NEVER" | "HOURLY" | "DAILY" | "WEEKLY"
  ) => {
    setIsUpdatingRescrapeFrequency(true);
    await updateRescrapeFrequency(resource.id, frequency);
    setIsUpdatingRescrapeFrequency(false);
    toast.success("Rescrape frequency updated");
  };

  const handleRescrapeNow = async () => {
    setIsRescraping(true);
    try {
      await rescrapeResource(resource.id);

      toast.success("Resource rescrape initiated");
    } catch {
      toast.error("Failed to rescrape resource");
    } finally {
      setIsRescraping(false);
    }
  };

  useEffect(() => {
    if (resource.title) {
      setFileTitle(resource.title);
    }
  }, [resource]);

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

          <TextLoop
            className="font-medium text-xs max-w-64 truncate"
            value={fileTitle}
          />

          <span className="text-muted-foreground text-xs whitespace-nowrap">
            {resource.type === "FILE" ? (
              <span className="flex items-center gap-1">
                created{" "}
                {formatDistanceToNow(resource.createdAt, {
                  addSuffix: true,
                })}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                scraped{" "}
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
          {resource.type === "LINK" && (
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setScrapeFrequency(resource.scrapeFrequency ?? "NEVER");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isUpdatingRescrapeFrequency}
                >
                  <Settings className="size-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rescrape</DialogTitle>
                  <DialogDescription>
                    Update the rescrape frequency for this link.
                  </DialogDescription>
                </DialogHeader>

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

                <DialogFooter className="flex justify-between sm:justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRescrapeNow}
                    disabled={isRescraping}
                    className="mr-auto"
                  >
                    {isRescraping ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Rescraping...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Rescrape Now
                      </>
                    )}
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setScrapeFrequency(resource.scrapeFrequency ?? "NEVER");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      className="w-24"
                      onClick={() => {
                        handleUpdateRescrapeFrequency(scrapeFrequency);
                        setIsDialogOpen(false);
                      }}
                      disabled={isUpdatingRescrapeFrequency}
                    >
                      Update
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
