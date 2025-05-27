"use client";

import { RunWithModelAndResources } from "@itzam/server/db/run/actions";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckIcon,
  ChevronDownIcon,
  CircleIcon,
  FileIcon,
  LinkIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import ModelIcon from "public/models/svgs/model-icon";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { TableCell, TableRow } from "~/components/ui/table";
import { RunOriginType } from "~/lib/mappers/run-origin";
import { formatDate } from "~/lib/utils";
import { Badge } from "../ui/badge";
import { RunOriginBadge } from "./run-origin-badge";
export function ExpandableRunRow({
  run,
}: {
  run: RunWithModelAndResources | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!run) {
    return null;
  }
  return (
    <>
      <TableRow
        id={`run-row-${run.id}`}
        className={`hover:cursor-pointer`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell className="min-w-[16px] max-w-[16px] pl-6">
          <Badge
            className="flex size-5 items-center justify-center rounded-md p-1"
            variant={
              run.status === "COMPLETED"
                ? "green"
                : run.status === "FAILED"
                  ? "red"
                  : "gray"
            }
          >
            {run.status === "COMPLETED" ? (
              <CheckIcon className="size-3 text-green-500" />
            ) : run.status === "FAILED" ? (
              <XIcon className="size-3 text-red-500" />
            ) : (
              <CircleIcon className="size-3 text-gray-500" />
            )}
          </Badge>
        </TableCell>
        <TableCell className="min-w-[100px] max-w-[100px] truncate text-sm">
          {formatDate(run.createdAt)}
        </TableCell>
        <TableCell className="min-w-[160px] max-w-[160px] truncate pr-8 text-sm">
          {run.input}
        </TableCell>

        <TableCell className="min-w-[100px] max-w-[100px] truncate pr-12 text-muted-foreground">
          ${run.cost}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {run.durationInMs}
        </TableCell>
        <TableCell>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDownIcon className="h-4 w-4" />
              </motion.div>
            </Button>
          </div>
        </TableCell>
      </TableRow>
      <AnimatePresence
        onExitComplete={() => {
          const parentRow = document.getElementById(`run-row-${run.id}`);
          if (parentRow) {
            parentRow.classList.remove("border-0");
            parentRow.classList.add("border-b");
          }
        }}
      >
        {isExpanded && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={6} className="p-0">
              <motion.div
                onAnimationStart={() => {
                  const parentRow = document.getElementById(
                    `run-row-${run.id}`
                  );

                  if (parentRow) {
                    parentRow.classList.add("border-0");
                    parentRow.classList.remove("border-b");
                  }
                }}
                initial={{ height: 0, opacity: 0, scale: 0.99 }}
                animate={{ height: "auto", opacity: 1, scale: 1 }}
                exit={{ height: 0, opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="flex gap-12 px-4 pt-6 pb-12">
                  <div className="flex w-3/6 flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <h4 className="text-muted-foreground text-sm">Prompt</h4>
                      <p className="mt-1 max-w-[400px] whitespace-pre-wrap font-mono text-xs">
                        {run.prompt}
                      </p>
                    </div>
                    {run.runResources.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <h4 className="text-muted-foreground text-sm">
                          Knowledge
                        </h4>
                        <div className="flex flex-col gap-1">
                          {run.runResources.map((resource) => (
                            <Link
                              href={resource.resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              key={resource.resource.id}
                            >
                              <div className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity">
                                {resource.resource.type === "FILE" ? (
                                  <FileIcon className="size-3 text-muted-foreground" />
                                ) : (
                                  <LinkIcon className="size-3 text-muted-foreground" />
                                )}
                                {resource.resource.title}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <h4 className="text-muted-foreground text-sm">Input</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {run.input}
                      </p>
                    </div>
                    {run.output && (
                      <div className="flex flex-col gap-1">
                        <h4 className="text-muted-foreground text-sm">
                          Output
                        </h4>
                        <p className="mt-1 max-w-[400px] whitespace-pre-wrap text-sm">
                          {run.output}
                        </p>
                      </div>
                    )}
                    {run.error && (
                      <div className="flex flex-col gap-1">
                        <h4 className="text-red-500 text-sm">Error</h4>
                        <p className="mt-1 max-w-[400px] whitespace-pre-wrap text-sm">
                          {run.error}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex w-1/6 flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <h4 className="text-muted-foreground text-sm">Status</h4>
                      <div className="mt-1 flex items-center">
                        <div
                          className={`mr-1.5 size-2 rounded-full bg-green-100 ${
                            run.status === "COMPLETED"
                              ? "bg-green-500"
                              : run.status === "FAILED"
                                ? "bg-red-500"
                                : "bg-gray-500"
                          }`}
                        />
                        <p
                          className={`text-sm ${
                            run.status === "COMPLETED"
                              ? "text-green-500"
                              : run.status === "FAILED"
                                ? "text-red-500"
                                : "text-gray-500"
                          }`}
                        >
                          {run.status.slice(0, 1).toUpperCase() +
                            run.status.slice(1).toLowerCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h4 className="text-muted-foreground text-sm">Cost</h4>
                      <p className="mt-1 text-sm">${run.cost}</p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h4 className="text-muted-foreground text-sm">
                        Started at
                      </h4>
                      <p className="mt-1 text-sm">
                        {run.createdAt.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h4 className="text-muted-foreground text-sm">
                        Thread ID
                      </h4>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-sm">{run.threadId ?? "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-1/6 flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <h4 className="text-muted-foreground text-sm">Model</h4>
                      <div className="mt-1 flex items-center gap-2">
                        <ModelIcon tag={run.model?.tag ?? ""} size="xs" />
                        <p className="text-sm">{run.model?.name}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h4 className="text-muted-foreground text-sm">Origin</h4>
                      <div className="mt-1">
                        <RunOriginBadge origin={run.origin as RunOriginType} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h4 className="text-muted-foreground text-sm">
                        Duration
                      </h4>
                      <p className="mt-1 text-sm">{run.durationInMs}ms</p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h4 className="text-muted-foreground text-sm">Tokens</h4>
                      <p className="mt-1 text-sm">
                        {run.inputTokens + run.outputTokens}
                        <span className="ml-1 text-muted-foreground text-xs">
                          ({run.inputTokens} + {run.outputTokens})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TableCell>
          </TableRow>
        )}
      </AnimatePresence>
    </>
  );
}
