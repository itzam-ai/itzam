import { atomWithStorage } from "jotai/utils";
import type { Message } from "~/components/message/message-list";

// Create a factory function for thread-related atoms
export const createThreadAtoms = (workflowId: string) => {
  // Thread ID atom with localStorage persistence
  const threadIdAtom = atomWithStorage<string | null>(
    `playground-threadId-${workflowId}`,
    null
  );

  // Mode atom with localStorage persistence
  const modeAtom = atomWithStorage<"single" | "thread">(
    `playground-mode-${workflowId}`,
    "single"
  );

  // Messages atoms with localStorage persistence per thread
  const messagesAtomsMap = new Map<string, ReturnType<typeof atomWithStorage<Message[]>>>();

  const getMessagesAtom = (threadId: string) => {
    if (!messagesAtomsMap.has(threadId)) {
      const messagesAtom = atomWithStorage<Message[]>(
        `playground-thread-messages-${threadId}`,
        [],
        {
          getItem: (key) => {
            const stored = localStorage.getItem(key);
            if (!stored) return [];
            try {
              const parsed = JSON.parse(stored) as Message[];
              // Convert timestamp strings back to Date objects
              return parsed.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }));
            } catch {
              return [];
            }
          },
          setItem: (key, value) => {
            // Only store the most recent 100 messages
            const messagesToStore = value.slice(-100);
            localStorage.setItem(key, JSON.stringify(messagesToStore));
          },
          removeItem: (key) => localStorage.removeItem(key),
        }
      );
      messagesAtomsMap.set(threadId, messagesAtom);
    }
    return messagesAtomsMap.get(threadId)!;
  };

  return {
    threadIdAtom,
    modeAtom,
    getMessagesAtom,
  };
};

// Store for workflow-specific atoms to avoid recreating them
const workflowAtomsStore = new Map<string, ReturnType<typeof createThreadAtoms>>();

export const getThreadAtoms = (workflowId: string) => {
  if (!workflowAtomsStore.has(workflowId)) {
    workflowAtomsStore.set(workflowId, createThreadAtoms(workflowId));
  }
  return workflowAtomsStore.get(workflowId)!;
};