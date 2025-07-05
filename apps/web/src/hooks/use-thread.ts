"use client";

import { useState, useCallback } from "react";

interface ThreadHookProps {
  workflowSlug: string;
  apiKey?: string;
}

export function useThread({ workflowSlug, apiKey }: ThreadHookProps) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createThread = useCallback(async (name?: string) => {
    if (!apiKey) {
      console.error("API key is required to create threads");
      return null;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/v1/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKey,
        },
        body: JSON.stringify({
          workflowSlug,
          name: name || `Thread ${new Date().toLocaleString()}`,
          lookupKeys: [],
          contextSlugs: [],
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
  }, [workflowSlug, apiKey]);

  return {
    threadId,
    setThreadId,
    createThread,
    isCreating,
  };
}