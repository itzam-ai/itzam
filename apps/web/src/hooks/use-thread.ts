"use client";

import { useState, useCallback } from "react";
import { useAtom } from "jotai";
import { createThread as createThreadAction } from "~/app/dashboard/workflows/[workflowId]/playground/actions";
import { getThreadAtoms } from "~/atoms/thread";

interface ThreadHookProps {
  workflowSlug: string;
  contextSlugs?: string[];
  workflowId: string;
}

export function useThread({ workflowSlug, contextSlugs = [], workflowId }: ThreadHookProps) {
  const [isCreating, setIsCreating] = useState(false);
  
  // Get atoms for this workflow
  const atoms = getThreadAtoms(workflowId);
  const [threadId, setThreadId] = useAtom(atoms.threadIdAtom);
  const [mode, setMode] = useAtom(atoms.modeAtom);
  
  // Get messages atom for current thread
  const messagesAtom = threadId ? atoms.getMessagesAtom(threadId) : null;
  const [messages, setMessages] = useAtom(messagesAtom || atoms.getMessagesAtom("default"));

  const clearMessages = useCallback(() => {
    if (threadId) {
      setMessages([]);
    }
  }, [threadId, setMessages]);

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
    messages: threadId ? messages : [],
    setMessages: threadId ? setMessages : () => {},
    clearMessages,
    mode,
    setMode,
  };
}