"use client";

import { RunWithModelAndResourcesAndAttachmentsAndThreads } from "@itzam/server/db/run/actions";
import type { EventMetadata, Metadata } from "@itzam/server/db/run/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckIcon,
  ChevronDownIcon,
  CircleIcon,
  FileIcon,
  GlobeIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import ModelIcon from "public/models/svgs/model-icon";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { TableCell, TableRow } from "~/components/ui/table";
import { RunOriginType } from "~/lib/mappers/run-origin";
import { cn, formatDate } from "~/lib/utils";
import { ImageAttachment } from "../message/image-attachment";
import { ThreadDrawer } from "../thread/drawer";
import { Badge } from "../ui/badge";
import { Code } from "../ui/code";
import { RunOriginBadge } from "./run-origin-badge";
import { RunTypeBadge } from "./run-type-badge";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

function RunDetail({
  title,
  value,
  className,
  titleClassName,
}: {
  title: string;
  value: string | React.ReactNode;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h4 className={cn("text-muted-foreground text-sm", titleClassName)}>
        {title}
      </h4>
      {typeof value === "string" ? (
        <p className={cn("mt-1 max-w-[400px] whitespace-pre-wrap", className)}>
          {value}
        </p>
      ) : (
        value
      )}
    </div>
  );
}

function RunDetails({
  run,
}: {
  run: RunWithModelAndResourcesAndAttachmentsAndThreads;
}) {
  const contexts = run.workflow?.contexts;
  const metadata = run.metadata as EventMetadata | Metadata;

  const resourcesFromKnowledge = run.runResources.filter(
    (resource) => resource.resource.knowledgeId
  );
  const resourcesFromContexts = run.runResources.filter(
    (resource) => resource.resource.contextId
  );

  const contextResourcesGroupedByContext = resourcesFromContexts?.reduce(
    (acc, resource) => {
      const contextId = resource.resource.contextId;
      if (!contextId) {
        return acc;
      }
      if (!acc[contextId]) {
        acc[contextId] = [];
      }
      acc[contextId].push(resource);
      return acc;
    },
    {} as Record<
      string,
      RunWithModelAndResourcesAndAttachmentsAndThreads["runResources"]
    >
  );

  const isEvent = metadata && "type" in metadata && metadata.type === "event";
  const isObject = metadata && metadata.aiParams.schema;

  return (
    <div className="flex gap-12 px-4 pt-6 pb-12">
      <div className="flex w-3/6 flex-col gap-6 overflow-x-auto">
        <RunDetail
          className="font-mono text-xs"
          title="Prompt"
          value={run.prompt}
        />
        {resourcesFromKnowledge && resourcesFromKnowledge.length > 0 && (
          <div className="flex flex-col gap-2">
            <h4 className="text-muted-foreground text-sm">Knowledge</h4>
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
                      <GlobeIcon className="size-3 text-muted-foreground" />
                    )}
                    {resource.resource.title}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        {contextResourcesGroupedByContext &&
          Object.keys(contextResourcesGroupedByContext).length > 0 &&
          Object.keys(contextResourcesGroupedByContext).map((contextId) => {
            const context = contexts?.find(
              (context) => context.id === contextId
            );
            return (
              <div className="flex flex-col gap-2" key={contextId}>
                <h4 className="text-muted-foreground text-sm">
                  {context?.name}
                </h4>
                <div className="flex flex-col gap-1">
                  {contextResourcesGroupedByContext[contextId]?.map(
                    (resource) => (
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
                            <GlobeIcon className="size-3 text-muted-foreground" />
                          )}
                          {resource.resource.title}
                        </div>
                      </Link>
                    )
                  )}
                </div>
              </div>
            );
          })}
        <RunDetail title="Input" value={run.input} />
        {run.attachments.length > 0 && (
          <div className="flex flex-col gap-1">
            <h4 className="text-muted-foreground text-sm">Attachments</h4>
            <div className="mt-1 flex flex-wrap gap-1">
              {run.attachments.map((attachment) => (
                <div
                  key={attachment.url}
                  className="flex size-12 items-center justify-center rounded-lg border cursor-pointer border-muted shadow-sm transition-all hover:border-muted-foreground/40"
                >
                  {attachment.mimeType.startsWith("image/") ? (
                    <ImageAttachment
                      mimeType={attachment.mimeType}
                      url={attachment.url}
                    />
                  ) : (
                    <Link
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={attachment.url}
                    >
                      <FileIcon className="size-4" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {run.output && (
          <div className="flex flex-col gap-1">
            <h4 className="text-muted-foreground text-sm">Output</h4>
            {isObject ? (
              <div className="mt-1 max-w-[400px] overflow-x-auto">
                <Code
                  code={(() => {
                    try {
                      // Parse and format JSON with proper indentation
                      const parsed = JSON.parse(run.output);
                      return JSON.stringify(parsed, null, 2);
                    } catch {
                      // If it's not valid JSON, return as-is
                      return run.output;
                    }
                  })()}
                  language="json"
                  className="[&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:whitespace-pre-wrap [&_code]:break-words"
                  style={{
                    fontSize: "12px",
                  }}
                />
              </div>
            ) : typeof run.output === "string" ? (
              <div className="mt-1 max-w-[400px] prose prose-sm dark:prose-invert prose-neutral prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-pre:my-2 prose-blockquote:my-2">
                <Markdown remarkPlugins={[remarkGfm]}>{run.output}</Markdown>
              </div>
            ) : (
              run.output
            )}
          </div>
        )}
        {run.error && (
          <RunDetail
            title="Error"
            value={run.error}
            titleClassName="text-red-500"
          />
        )}
      </div>

      <div className="flex w-1/6 flex-col gap-6">
        <RunDetail
          title="Status"
          value={
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
          }
        />

        <RunDetail
          title="Model"
          value={
            <div className="mt-1 flex items-center gap-2">
              <ModelIcon tag={run.model?.tag ?? ""} size="xs" />
              <p className="text-sm">{run.model?.name}</p>
            </div>
          }
        />

        <RunDetail
          title="Origin"
          value={<RunOriginBadge origin={run.origin as RunOriginType} />}
        />

        <RunDetail
          title="Thread"
          value={
            <div className="mt-1 flex items-center gap-2">
              {run.threadId ? (
                <ThreadDrawer
                  thread={{
                    id: run.threadId,
                    name: run.thread?.name ?? "",
                    lookupKeys: run.thread?.lookupKeys ?? [],
                  }}
                />
              ) : (
                <p className="text-sm">N/A</p>
              )}
            </div>
          }
        />
        {isEvent && (
          <RunDetail
            title="Type"
            value={<RunTypeBadge type={metadata.type} />}
          />
        )}
      </div>

      <div className="flex w-1/6 flex-col gap-6">
        <RunDetail title="Date" value={run.createdAt.toLocaleString()} />

        <RunDetail title="Duration" value={`${run.durationInMs}ms`} />

        <RunDetail title="Cost" value={`$${run.cost}`} />

        <RunDetail
          title="Tokens"
          value={`${run.inputTokens + run.outputTokens} (${run.inputTokens} + ${run.outputTokens})`}
        />
        {isEvent && (
          <RunDetail
            className="text-wrap break-all"
            title="Callback URL"
            value={metadata.callback.url}
          />
        )}
      </div>
    </div>
  );
}

export function ExpandableRunRow({
  run,
}: {
  run: RunWithModelAndResourcesAndAttachmentsAndThreads | null;
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
                <RunDetails run={run} />
              </motion.div>
            </TableCell>
          </TableRow>
        )}
      </AnimatePresence>
    </>
  );
}
