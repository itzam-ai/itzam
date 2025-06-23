import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '../../index';
import { threads, contexts, workflows, threadContexts } from '../../schema';
import { eq, and, inArray } from 'drizzle-orm';

// Mock the database
vi.mock('../../index', () => ({
  db: {
    query: {
      threadContexts: {
        findMany: vi.fn(),
      },
      threads: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      contexts: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
}));

// Mock uuid
vi.mock('uuid', () => ({
  v7: vi.fn(() => 'test-uuid'),
}));

describe('Thread-Context Management Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addContextsToThread', () => {
    const addContextsToThread = async (threadId: string, contextIds: string[]) => {
      // Validate contexts exist
      const existingContexts = await db.query.contexts.findMany({
        where: inArray(contexts.id, contextIds),
        columns: { id: true },
      });

      if (existingContexts.length !== contextIds.length) {
        throw new Error('One or more contexts not found');
      }

      // Remove existing relationships
      await db.delete(threadContexts).where(eq(threadContexts.threadId, threadId));

      // Add new relationships
      const relationships = contextIds.map(contextId => ({
        threadId,
        contextId,
      }));

      await db.insert(threadContexts).values(relationships);

      return { success: true };
    };

    it('should add multiple contexts to a thread', async () => {
      const mockContexts = [
        { id: 'context-1' },
        { id: 'context-2' },
        { id: 'context-3' },
      ];

      const mockDelete = {
        where: vi.fn().mockResolvedValue(undefined),
      };
      const mockInsert = {
        values: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(db.query.contexts.findMany).mockResolvedValue(mockContexts);
      vi.mocked(db.delete).mockReturnValue(mockDelete);
      vi.mocked(db.insert).mockReturnValue(mockInsert);

      const result = await addContextsToThread('thread-1', ['context-1', 'context-2', 'context-3']);

      expect(result).toEqual({ success: true });
      expect(db.query.contexts.findMany).toHaveBeenCalledWith({
        where: expect.anything(),
        columns: { id: true },
      });
      expect(db.delete).toHaveBeenCalledWith(threadContexts);
      expect(mockDelete.where).toHaveBeenCalledWith(expect.anything());
      expect(db.insert).toHaveBeenCalledWith(threadContexts);
      expect(mockInsert.values).toHaveBeenCalledWith([
        { threadId: 'thread-1', contextId: 'context-1' },
        { threadId: 'thread-1', contextId: 'context-2' },
        { threadId: 'thread-1', contextId: 'context-3' },
      ]);
    });

    it('should throw error if context does not exist', async () => {
      const mockContexts = [
        { id: 'context-1' },
        // Missing context-2
      ];

      vi.mocked(db.query.contexts.findMany).mockResolvedValue(mockContexts);

      await expect(addContextsToThread('thread-1', ['context-1', 'context-2']))
        .rejects.toThrow('One or more contexts not found');
    });

    it('should handle empty context list', async () => {
      const mockDelete = {
        where: vi.fn().mockResolvedValue(undefined),
      };
      const mockInsert = {
        values: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(db.query.contexts.findMany).mockResolvedValue([]);
      vi.mocked(db.delete).mockReturnValue(mockDelete);
      vi.mocked(db.insert).mockReturnValue(mockInsert);

      const result = await addContextsToThread('thread-1', []);

      expect(result).toEqual({ success: true });
      expect(db.delete).toHaveBeenCalledWith(threadContexts);
      expect(mockInsert.values).toHaveBeenCalledWith([]);
    });
  });

  describe('removeContextsFromThread', () => {
    const removeContextsFromThread = async (threadId: string, contextIds?: string[]) => {
      if (contextIds && contextIds.length > 0) {
        // Remove specific contexts
        await db.delete(threadContexts).where(
          and(
            eq(threadContexts.threadId, threadId),
            inArray(threadContexts.contextId, contextIds)
          )
        );
      } else {
        // Remove all contexts from thread
        await db.delete(threadContexts).where(eq(threadContexts.threadId, threadId));
      }

      return { success: true };
    };

    it('should remove specific contexts from thread', async () => {
      const mockDelete = {
        where: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(db.delete).mockReturnValue(mockDelete);

      const result = await removeContextsFromThread('thread-1', ['context-1', 'context-2']);

      expect(result).toEqual({ success: true });
      expect(db.delete).toHaveBeenCalledWith(threadContexts);
      expect(mockDelete.where).toHaveBeenCalledWith(expect.anything());
    });

    it('should remove all contexts from thread when no specific contexts provided', async () => {
      const mockDelete = {
        where: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(db.delete).mockReturnValue(mockDelete);

      const result = await removeContextsFromThread('thread-1');

      expect(result).toEqual({ success: true });
      expect(db.delete).toHaveBeenCalledWith(threadContexts);
      expect(mockDelete.where).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('getThreadsWithContexts', () => {
    const getThreadsWithContexts = async (workflowId: string) => {
      const threadsWithContexts = await db.query.threads.findMany({
        where: eq(threads.workflowId, workflowId),
        with: {
          threadContexts: {
            with: {
              context: {
                columns: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      return threadsWithContexts.map(thread => ({
        ...thread,
        contexts: thread.threadContexts?.map(tc => tc.context) || [],
      }));
    };

    it('should return threads with their associated contexts', async () => {
      const mockThreads = [
        {
          id: 'thread-1',
          name: 'Thread 1',
          workflowId: 'workflow-1',
          threadContexts: [
            {
              context: {
                id: 'context-1',
                name: 'Context 1',
                slug: 'context-1',
              },
            },
            {
              context: {
                id: 'context-2',
                name: 'Context 2',
                slug: 'context-2',
              },
            },
          ],
        },
        {
          id: 'thread-2',
          name: 'Thread 2',
          workflowId: 'workflow-1',
          threadContexts: [],
        },
      ];

      vi.mocked(db.query.threads.findMany).mockResolvedValue(mockThreads);

      const result = await getThreadsWithContexts('workflow-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'thread-1',
        name: 'Thread 1',
        contexts: [
          { id: 'context-1', name: 'Context 1', slug: 'context-1' },
          { id: 'context-2', name: 'Context 2', slug: 'context-2' },
        ],
      });
      expect(result[1]).toMatchObject({
        id: 'thread-2',
        name: 'Thread 2',
        contexts: [],
      });
    });
  });

  describe('transaction handling', () => {
    const updateThreadContextsTransaction = async (threadId: string, contextIds: string[]) => {
      return await db.transaction(async (tx) => {
        // Validate contexts exist
        const existingContexts = await tx.query.contexts.findMany({
          where: inArray(contexts.id, contextIds),
          columns: { id: true },
        });

        if (existingContexts.length !== contextIds.length) {
          throw new Error('One or more contexts not found');
        }

        // Remove existing relationships
        await tx.delete(threadContexts).where(eq(threadContexts.threadId, threadId));

        // Add new relationships
        if (contextIds.length > 0) {
          const relationships = contextIds.map(contextId => ({
            threadId,
            contextId,
          }));
          await tx.insert(threadContexts).values(relationships);
        }

        return { success: true };
      });
    };

    it('should handle transaction for updating thread contexts', async () => {
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            contexts: {
              findMany: vi.fn().mockResolvedValue([{ id: 'context-1' }]),
            },
          },
          delete: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue(undefined),
          }),
        };
        return await callback(mockTx);
      });

      vi.mocked(db.transaction).mockImplementation(mockTransaction);

      const result = await updateThreadContextsTransaction('thread-1', ['context-1']);

      expect(result).toEqual({ success: true });
      expect(db.transaction).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should rollback transaction on error', async () => {
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            contexts: {
              findMany: vi.fn().mockResolvedValue([]), // No contexts found
            },
          },
        };
        return await callback(mockTx);
      });

      vi.mocked(db.transaction).mockImplementation(mockTransaction);

      await expect(updateThreadContextsTransaction('thread-1', ['context-1']))
        .rejects.toThrow('One or more contexts not found');
    });
  });

  describe('context validation', () => {
    const validateContextsExist = async (contextIds: string[]) => {
      const existingContexts = await db.query.contexts.findMany({
        where: inArray(contexts.id, contextIds),
        columns: { id: true },
      });

      const existingIds = existingContexts.map(c => c.id);
      const missingIds = contextIds.filter(id => !existingIds.includes(id));

      return {
        valid: missingIds.length === 0,
        missing: missingIds,
        existing: existingIds,
      };
    };

    it('should validate all contexts exist', async () => {
      const mockContexts = [
        { id: 'context-1' },
        { id: 'context-2' },
      ];

      vi.mocked(db.query.contexts.findMany).mockResolvedValue(mockContexts);

      const result = await validateContextsExist(['context-1', 'context-2']);

      expect(result).toEqual({
        valid: true,
        missing: [],
        existing: ['context-1', 'context-2'],
      });
    });

    it('should identify missing contexts', async () => {
      const mockContexts = [
        { id: 'context-1' },
      ];

      vi.mocked(db.query.contexts.findMany).mockResolvedValue(mockContexts);

      const result = await validateContextsExist(['context-1', 'context-2', 'context-3']);

      expect(result).toEqual({
        valid: false,
        missing: ['context-2', 'context-3'],
        existing: ['context-1'],
      });
    });
  });
});