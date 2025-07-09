"use client";

import { RunWithResourcesAndAttachments } from "@itzam/server/db/run/actions";
import { FileIcon } from "lucide-react";
import Link from "next/link";
import ModelIcon from "public/models/svgs/model-icon";
import type { ModelWithCostAndProvider } from "@itzam/server/db/model/actions";
import { ImageAttachment } from "./image-attachment";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface MessageItemProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  model?: ModelWithCostAndProvider | null;
  attachments?: RunWithResourcesAndAttachments["attachments"];
  showTimestamp?: boolean;
}

export function MessageItem({
  role,
  content,
  timestamp,
  model,
  attachments,
  showTimestamp = false,
}: MessageItemProps) {
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
        <div className="prose prose-sm dark:prose-invert prose-neutral max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-pre:my-2 prose-blockquote:my-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
        {model && (
          <div className="flex gap-1.5 items-center">
            <ModelIcon tag={model.tag ?? ""} size="us" />
            <p className="text-xs text-muted-foreground">
              {model.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}