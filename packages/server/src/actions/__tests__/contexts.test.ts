import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  getContexts, 
  getContext, 
  createContext, 
  updateContext, 
  addResourceToContexts 
} from '../contexts';
import { db } from '../../db';
import { contexts, resourceContexts, resources, workflows } from '../../db/schema';
import { revalidatePath, revalidateTag } from 'next/cache';
import { v7 as uuidv7 } from 'uuid';

// Mock dependencies
vi.mock('../../db', () => ({
  db: {
    query: {
      contexts: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      workflows: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('uuid', () => ({
  v7: vi.fn(() => 'test-uuid'),
}));

describe('Context Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getContexts', () => {
    it('should fetch contexts for a workflow by slug', async () => {
      const mockContexts = [
        {
          id: 'context-1',
          name: 'Context 1',
          slug: 'context-1',
          workflowId: 'workflow-123',
          resourceContexts: [
            {
              resourceId: 'resource-1',
              resource: {
                id: 'resource-1',
                title: 'Resource 1',
                type: 'URL',
              },
            },
          ],
        },
        {
          id: 'context-2',
          name: 'Context 2',
          slug: 'context-2',
          workflowId: 'workflow-123',
          resourceContexts: [],
        },
      ];

      vi.mocked(db.query.contexts.findMany).mockResolvedValue(mockContexts);

      const result = await getContexts('test-workflow');

      expect(result.data).toEqual(mockContexts);
      expect(db.query.contexts.findMany).toHaveBeenCalledWith({
        where: expect.anything(),
        with: {
          resourceContexts: {
            with: {
              resource: true,
            },
          },
        },
      });
    });

    it('should handle errors when fetching contexts', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Database error');
      vi.mocked(db.query.contexts.findMany).mockRejectedValue(error);

      await expect(getContexts('test-workflow')).rejects.toThrow('Database error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching contexts:', error);
    });
  });

  describe('getContext', () => {
    it('should fetch a context by ID or slug', async () => {
      const mockContext = {
        id: 'context-123',
        name: 'Test Context',
        slug: 'test-context',
        workflowId: 'workflow-123',
        resourceContexts: [
          {
            resourceId: 'resource-1',
            resource: {
              id: 'resource-1',
              title: 'Resource 1',
            },
          },
        ],
      };

      vi.mocked(db.query.contexts.findFirst).mockResolvedValue(mockContext);

      const result = await getContext('context-123');

      expect(result.data).toEqual(mockContext);
      expect(db.query.contexts.findFirst).toHaveBeenCalledWith({
        where: expect.anything(),
        with: {
          resourceContexts: {
            with: {
              resource: true,
            },
          },
        },
      });
    });

    it('should handle errors when fetching a context', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Database error');
      vi.mocked(db.query.contexts.findFirst).mockRejectedValue(error);

      await expect(getContext('context-123')).rejects.toThrow('Database error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching context:', error);
    });
  });

  describe('createContext', () => {
    it('should create a new context', async () => {
      const mockContext = {
        id: 'test-uuid',
        name: 'New Context',
        slug: 'new-context',
        description: 'Test description',
        workflowId: 'workflow-123',
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockContext]),
        }),
      });

      const input = {
        name: 'New Context',
        slug: 'new-context',
        description: 'Test description',
        workflowId: 'workflow-123',
      };

      const result = await createContext(input);

      expect(result).toEqual(mockContext);
      expect(db.insert).toHaveBeenCalledWith(contexts);
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/workflows/workflow-123/knowledge');
    });

    it('should create a context with resources', async () => {
      const mockContext = {
        id: 'test-uuid',
        name: 'New Context',
        slug: 'new-context',
        workflowId: 'workflow-123',
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockContext]),
        }),
      });

      const input = {
        name: 'New Context',
        slug: 'new-context',
        workflowId: 'workflow-123',
        resourceIds: ['resource-1', 'resource-2'],
      };

      await createContext(input);

      expect(db.insert).toHaveBeenCalledTimes(2);
      expect(db.insert).toHaveBeenNthCalledWith(1, contexts);
      expect(db.insert).toHaveBeenNthCalledWith(2, resourceContexts);
    });

    it('should throw error if context creation fails', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });

      const input = {
        name: 'New Context',
        slug: 'new-context',
        workflowId: 'workflow-123',
      };

      await expect(createContext(input)).rejects.toThrow('Failed to create context');
    });
  });

  describe('updateContext', () => {
    it('should update context details', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await updateContext('context-123', {
        name: 'Updated Context',
        description: 'Updated description',
      });

      expect(result).toEqual({ success: true });
      expect(db.update).toHaveBeenCalledWith(contexts);
      expect(revalidateTag).toHaveBeenCalledWith('contexts');
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/workflows');
    });

    it('should handle resource removal', async () => {
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      await updateContext('context-123', {
        resources: {
          remove: ['resource-1', 'resource-2'],
        },
      });

      expect(db.delete).toHaveBeenCalledWith(resourceContexts);
    });

    it('should handle resource addition', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      await updateContext('context-123', {
        resources: {
          add: [
            { id: 'resource-1', type: 'URL' },
            { id: 'resource-2', type: 'TEXT' },
          ],
        },
      });

      expect(db.insert).toHaveBeenCalledWith(resourceContexts);
    });

    it('should handle errors during update', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Update failed');
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(error),
        }),
      });

      await expect(updateContext('context-123', { name: 'Updated' })).rejects.toThrow('Update failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating context:', error);
    });
  });

  describe('addResourceToContexts', () => {
    it('should add resource to contexts and remove from knowledge', async () => {
      const mockContexts = [
        {
          id: 'context-1',
          workflowId: 'workflow-123',
          resourceContexts: [],
        },
        {
          id: 'context-2',
          workflowId: 'workflow-123',
          resourceContexts: [{ resourceId: 'resource-1' }],
        },
      ];

      vi.mocked(db.query.contexts.findMany).mockResolvedValue(mockContexts);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      await addResourceToContexts('resource-1', ['context-1'], 'workflow-123');

      // Should remove from knowledge
      expect(db.update).toHaveBeenCalledWith(resources);
      
      // Should add to context-1
      expect(db.insert).toHaveBeenCalledWith(resourceContexts);
    });

    it('should remove resource from all contexts and add back to knowledge', async () => {
      const mockContexts = [
        {
          id: 'context-1',
          workflowId: 'workflow-123',
          resourceContexts: [{ resourceId: 'resource-1' }],
        },
      ];

      const mockWorkflow = {
        id: 'workflow-123',
        knowledgeId: 'knowledge-123',
      };

      vi.mocked(db.query.contexts.findMany).mockResolvedValue(mockContexts);
      vi.mocked(db.query.workflows.findFirst).mockResolvedValue(mockWorkflow);
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      await addResourceToContexts('resource-1', [], 'workflow-123');

      // Should remove from context
      expect(db.delete).toHaveBeenCalledWith(resourceContexts);
      
      // Should add back to knowledge
      expect(db.update).toHaveBeenCalledWith(resources);
      expect(db.update).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when updating resource contexts', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Update failed');
      vi.mocked(db.query.contexts.findMany).mockRejectedValue(error);

      await expect(addResourceToContexts('resource-1', ['context-1'], 'workflow-123'))
        .rejects.toThrow('Update failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating resource contexts:', error);
    });
  });
});