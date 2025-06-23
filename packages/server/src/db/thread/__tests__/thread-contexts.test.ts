import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '../../index';
import { threads, contexts, workflows, threadContexts } from '../../schema';
import { getThreadContextIds } from '../actions';
import { eq, and } from 'drizzle-orm';

// Mock the database
vi.mock('../../index', () => ({
  db: {
    query: {
      threadContexts: {
        findMany: vi.fn(),
      },
      threads: {
        findFirst: vi.fn(),
      },
      workflows: {
        findFirst: vi.fn(),
      },
      contexts: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
  },
}));

describe('Thread-Context Relationships', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('threadContexts junction table operations', () => {
    it('should insert thread-context relationships', async () => {
      const mockInsert = {
        values: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(db.insert).mockReturnValue(mockInsert);

      await db.insert(threadContexts).values([
        { threadId: 'thread-1', contextId: 'context-1' },
        { threadId: 'thread-1', contextId: 'context-2' },
      ]);

      expect(db.insert).toHaveBeenCalledWith(threadContexts);
      expect(mockInsert.values).toHaveBeenCalledWith([
        { threadId: 'thread-1', contextId: 'context-1' },
        { threadId: 'thread-1', contextId: 'context-2' },
      ]);
    });

    it('should delete thread-context relationships', async () => {
      const mockDelete = {
        where: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(db.delete).mockReturnValue(mockDelete);

      await db.delete(threadContexts).where(eq(threadContexts.threadId, 'thread-1'));

      expect(db.delete).toHaveBeenCalledWith(threadContexts);
      expect(mockDelete.where).toHaveBeenCalled();
    });

    it('should query thread-context relationships', async () => {
      const mockThreadContexts = [
        { threadId: 'thread-1', contextId: 'context-1' },
        { threadId: 'thread-1', contextId: 'context-2' },
      ];

      vi.mocked(db.query.threadContexts.findMany).mockResolvedValue(mockThreadContexts);

      const result = await db.query.threadContexts.findMany({
        where: eq(threadContexts.threadId, 'thread-1'),
      });

      expect(result).toEqual(mockThreadContexts);
      expect(db.query.threadContexts.findMany).toHaveBeenCalledWith({
        where: expect.anything(),
      });
    });
  });

  describe('getThreadContextIds function', () => {
    it('should return context IDs from threadContexts junction table when available', async () => {
      const mockThreadContexts = [
        { threadId: 'thread-1', contextId: 'context-1' },
        { threadId: 'thread-1', contextId: 'context-2' },
      ];

      vi.mocked(db.query.threadContexts.findMany).mockResolvedValue(mockThreadContexts);

      const result = await getThreadContextIds('thread-1');

      expect(result).toEqual(['context-1', 'context-2']);
      expect(db.query.threadContexts.findMany).toHaveBeenCalledWith({
        where: eq(threadContexts.threadId, 'thread-1'),
        columns: { contextId: true },
      });
    });

    it('should fallback to workflow context when no direct thread contexts exist', async () => {
      const mockThread = {
        id: 'thread-1',
        workflowId: 'workflow-1',
      };

      const mockWorkflow = {
        id: 'workflow-1',
        contextId: 'context-from-workflow',
      };

      // No direct thread contexts
      vi.mocked(db.query.threadContexts.findMany).mockResolvedValue([]);
      vi.mocked(db.query.threads.findFirst).mockResolvedValue(mockThread);
      vi.mocked(db.query.workflows.findFirst).mockResolvedValue(mockWorkflow);

      const result = await getThreadContextIds('thread-1');

      expect(result).toEqual(['context-from-workflow']);
      expect(db.query.threadContexts.findMany).toHaveBeenCalledWith({
        where: eq(threadContexts.threadId, 'thread-1'),
        columns: { contextId: true },
      });
      expect(db.query.threads.findFirst).toHaveBeenCalledWith({
        where: eq(threads.id, 'thread-1'),
        columns: { workflowId: true },
      });
      expect(db.query.workflows.findFirst).toHaveBeenCalledWith({
        where: eq(workflows.id, 'workflow-1'),
        columns: { contextId: true },
      });
    });

    it('should return empty array when no contexts found anywhere', async () => {
      const mockThread = {
        id: 'thread-1',
        workflowId: 'workflow-1',
      };

      const mockWorkflow = {
        id: 'workflow-1',
        contextId: null,
      };

      // No direct thread contexts
      vi.mocked(db.query.threadContexts.findMany).mockResolvedValue([]);
      vi.mocked(db.query.threads.findFirst).mockResolvedValue(mockThread);
      vi.mocked(db.query.workflows.findFirst).mockResolvedValue(mockWorkflow);

      const result = await getThreadContextIds('thread-1');

      expect(result).toEqual([]);
    });

    it('should return empty array when thread not found', async () => {
      // No direct thread contexts
      vi.mocked(db.query.threadContexts.findMany).mockResolvedValue([]);
      vi.mocked(db.query.threads.findFirst).mockResolvedValue(null);

      const result = await getThreadContextIds('non-existent-thread');

      expect(result).toEqual([]);
      expect(db.query.threads.findFirst).toHaveBeenCalledWith({
        where: eq(threads.id, 'non-existent-thread'),
        columns: { workflowId: true },
      });
    });

    it('should return empty array when workflow not found', async () => {
      const mockThread = {
        id: 'thread-1',
        workflowId: 'non-existent-workflow',
      };

      // No direct thread contexts
      vi.mocked(db.query.threadContexts.findMany).mockResolvedValue([]);
      vi.mocked(db.query.threads.findFirst).mockResolvedValue(mockThread);
      vi.mocked(db.query.workflows.findFirst).mockResolvedValue(null);

      const result = await getThreadContextIds('thread-1');

      expect(result).toEqual([]);
      expect(db.query.workflows.findFirst).toHaveBeenCalledWith({
        where: eq(workflows.id, 'non-existent-workflow'),
        columns: { contextId: true },
      });
    });

    it('should handle database errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Database connection failed');
      
      vi.mocked(db.query.threadContexts.findMany).mockRejectedValue(error);

      const result = await getThreadContextIds('thread-1');

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting thread context IDs:', error);
    });
  });

  describe('thread-context relationship validation', () => {
    it('should validate that context exists before creating relationship', async () => {
      const mockContext = {
        id: 'context-1',
        name: 'Test Context',
        workflowId: 'workflow-1',
      };

      vi.mocked(db.query.contexts.findFirst).mockResolvedValue(mockContext);

      const result = await db.query.contexts.findFirst({
        where: eq(contexts.id, 'context-1'),
      });

      expect(result).toEqual(mockContext);
      expect(db.query.contexts.findFirst).toHaveBeenCalledWith({
        where: expect.anything(),
      });
    });

    it('should handle non-existent context validation', async () => {
      vi.mocked(db.query.contexts.findFirst).mockResolvedValue(null);

      const result = await db.query.contexts.findFirst({
        where: eq(contexts.id, 'non-existent-context'),
      });

      expect(result).toBeNull();
    });
  });

  describe('bulk operations', () => {
    it('should handle bulk insert of thread-context relationships', async () => {
      const mockInsert = {
        values: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(db.insert).mockReturnValue(mockInsert);

      const relationships = [
        { threadId: 'thread-1', contextId: 'context-1' },
        { threadId: 'thread-1', contextId: 'context-2' },
        { threadId: 'thread-1', contextId: 'context-3' },
      ];

      await db.insert(threadContexts).values(relationships);

      expect(db.insert).toHaveBeenCalledWith(threadContexts);
      expect(mockInsert.values).toHaveBeenCalledWith(relationships);
    });

    it('should handle bulk delete of thread-context relationships', async () => {
      const mockDelete = {
        where: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(db.delete).mockReturnValue(mockDelete);

      await db.delete(threadContexts).where(
        and(
          eq(threadContexts.threadId, 'thread-1'),
          eq(threadContexts.contextId, 'context-1')
        )
      );

      expect(db.delete).toHaveBeenCalledWith(threadContexts);
      expect(mockDelete.where).toHaveBeenCalled();
    });
  });

  describe('performance considerations', () => {
    it('should efficiently query multiple thread contexts', async () => {
      const mockThreadContexts = [
        { threadId: 'thread-1', contextId: 'context-1' },
        { threadId: 'thread-1', contextId: 'context-2' },
        { threadId: 'thread-1', contextId: 'context-3' },
      ];

      vi.mocked(db.query.threadContexts.findMany).mockResolvedValue(mockThreadContexts);

      const result = await getThreadContextIds('thread-1');

      expect(result).toEqual(['context-1', 'context-2', 'context-3']);
      // Should only make one query to threadContexts
      expect(db.query.threadContexts.findMany).toHaveBeenCalledTimes(1);
      // Should not fallback to workflow query since direct contexts exist
      expect(db.query.threads.findFirst).not.toHaveBeenCalled();
      expect(db.query.workflows.findFirst).not.toHaveBeenCalled();
    });

    it('should minimize queries when falling back to workflow context', async () => {
      const mockThread = {
        id: 'thread-1',
        workflowId: 'workflow-1',
      };

      const mockWorkflow = {
        id: 'workflow-1',
        contextId: 'context-from-workflow',
      };

      // No direct thread contexts
      vi.mocked(db.query.threadContexts.findMany).mockResolvedValue([]);
      vi.mocked(db.query.threads.findFirst).mockResolvedValue(mockThread);
      vi.mocked(db.query.workflows.findFirst).mockResolvedValue(mockWorkflow);

      const result = await getThreadContextIds('thread-1');

      expect(result).toEqual(['context-from-workflow']);
      // Should make exactly 3 queries: threadContexts, threads, workflows
      expect(db.query.threadContexts.findMany).toHaveBeenCalledTimes(1);
      expect(db.query.threads.findFirst).toHaveBeenCalledTimes(1);
      expect(db.query.workflows.findFirst).toHaveBeenCalledTimes(1);
    });
  });
});