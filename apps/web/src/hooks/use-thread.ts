"use client";

import { useState, useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";

interface ThreadHookProps {
  workflowSlug: string;
  contextSlugs?: string[];
  workflowId: string;
}

export function useThread({ workflowSlug, contextSlugs = [], workflowId }: ThreadHookProps) {
  const [threadId, setThreadId] = useLocalStorage<string | null>(
    `playground-threadId-${workflowId}`,
    null
  );
  const [isCreating, setIsCreating] = useState(false);

  const createThread = useCallback(async (name?: string) => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflowSlug,
          name: name || `Thread ${new Date().toLocaleString()}`,
          lookupKeys: ["playground"],
          contextSlugs: contextSlugs.length > 0 ? contextSlugs : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create thread");
      }

      const data = await response.json();
      setThreadId(data.id);
      return data.id;
    } catch (error) {
      console.error("Error creating thread:", error);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [workflowSlug, contextSlugs]);

  return {
    threadId,
    setThreadId,
    createThread,
    isCreating,
  };
}