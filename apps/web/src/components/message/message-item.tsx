"use client";

import { RunWithResourcesAndAttachments } from "@itzam/server/db/run/actions";
import {
  FileIcon,
  Wrench,
  CheckCircle2,
  XCircle,
  Loader2,
  Code2,
} from "lucide-react";
import Link from "next/link";
import ModelIcon from "public/models/svgs/model-icon";
import type { ModelWithCostAndProvider } from "@itzam/server/db/model/actions";
import { ImageAttachment } from "./image-attachment";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import type { ToolCall } from "./message-list";

export interface MessageItemProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  model?: ModelWithCostAndProvider | null;
  attachments?: RunWithResourcesAndAttachments["attachments"];
  showTimestamp?: boolean;
  toolCalls?: ToolCall[];
}

export function MessageItem({
  role,
  content,
  timestamp,
  model,
  attachments,
  showTimestamp = false,
  toolCalls,
}: MessageItemProps) {
  const getToolStatusIcon = (status?: ToolCall["status"]) => {
    switch (status) {
      case "pending":
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case "running":
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case "completed":
        return (
          <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
        );
      case "failed":
        return <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />;
      default:
        return <Wrench className="h-3 w-3" />;
    }
  };

  const getToolStatusText = (status?: ToolCall["status"]) => {
    switch (status) {
      case "pending":
        return "Preparing...";
      case "running":
        return "Running...";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return "Tool Call";
    }
  };

  if (role === "user") {
    return (
      <div className="flex justify-end gap-1">
        <div className="flex flex-col gap-2 items-end max-w-[80%]">
          {attachments && attachments.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {attachments.map((attachment) => (
                <div
                  key={attachment.url}
                  className="flex size-12 items-center justify-center rounded-lg border cursor-pointer border-muted transition-all hover:border-muted-foreground/50 hover:opacity-80"
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
          )}
          <div className="bg-muted text-foreground rounded-full px-4 py-2">
            <p className="text-sm">{content}</p>
          </div>
          {showTimestamp && timestamp && (
            <p className="text-xs text-muted-foreground">
              {timestamp.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex flex-col gap-2 items-start max-w-[80%] py-2">
        {/* Tool Calls Display */}
        {toolCalls && toolCalls.length > 0 && (
          <div className="flex flex-col gap-2 mb-3 w-full">
            {toolCalls.map((toolCall) => (
              <Card key={toolCall.id} className="p-3 bg-muted/50 border-muted">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {getToolStatusIcon(toolCall.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="gray" className="text-xs">
                        <Wrench className="h-3 w-3 mr-1" />
                        {toolCall.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getToolStatusText(toolCall.status)}
                      </span>
                    </div>

                    {/* Show arguments if available */}
                    {toolCall.args && Object.keys(toolCall.args).length > 0 && (
                      <div className="mt-2 text-xs">
                        <details className="group">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1">
                            <Code2 className="h-3 w-3" />
                            <span>View arguments</span>
                          </summary>
                          <div className="mt-2 p-2 bg-background rounded border border-border">
                            <pre className="text-xs overflow-x-auto">
                              {JSON.stringify(toolCall.args, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </div>
                    )}

                    {/* Show result if available and completed */}
                    {toolCall.status === "completed" && toolCall.result && (
                      <div className="mt-2 text-xs">
                        <details className="group">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>View result</span>
                          </summary>
                          <div className="mt-2 p-2 bg-background rounded border border-border">
                            <pre className="text-xs overflow-x-auto">
                              {typeof toolCall.result === "string"
                                ? toolCall.result
                                : JSON.stringify(toolCall.result, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </div>
                    )}

                    {/* Show error if failed */}
                    {toolCall.status === "failed" && toolCall.result && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs text-red-600 dark:text-red-400">
                        {typeof toolCall.result === "string"
                          ? toolCall.result
                          : JSON.stringify(toolCall.result)}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Message Content */}
        <div className="prose prose-sm dark:prose-invert prose-neutral max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-pre:my-2 prose-blockquote:my-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>

        {/* Model Info */}
        {model && (
          <div className="flex gap-1.5 items-center">
            <ModelIcon tag={model.tag ?? ""} size="us" />
            <p className="text-xs text-muted-foreground">{model.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}
