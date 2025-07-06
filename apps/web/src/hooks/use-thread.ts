"use client";

import { useState, useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";
import { createThread as createThreadAction } from "~/app/dashboard/workflows/[workflowId]/playground/actions";

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
      const data = await createThreadAction({
        workflowSlug,
        name: name || `Thread ${new Date().toLocaleString()}`,
        lookupKeys: ["playground"],
        contextSlugs: contextSlugs.length > 0 ? contextSlugs : undefined,
      });

      setThreadId(data.id);
      return data.id;
    } catch (error) {
      console.error("Error creating thread:", error);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [workflowSlug, contextSlugs, setThreadId]);

  return {
    threadId,
    setThreadId,
    createThread,
    isCreating,
  };
}