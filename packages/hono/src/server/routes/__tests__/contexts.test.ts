import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { contextsRoute } from '../contexts';
import { db } from '@itzam/server/db/index';
import { contexts, workflows, resources, resourceContexts } from '@itzam/server/db/schema';
import { eq } from 'drizzle-orm';

// Mock the database
vi.mock('@itzam/server/db/index', () => ({
  db: {
    query: {
      workflows: {
        findFirst: vi.fn(),
      },
      contexts: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
  },
}));

// Mock the API key middleware
vi.mock('../../api-key-validator', () => ({
  apiKeyMiddleware: vi.fn((c, next) => next()),
}));

// Mock uuid
vi.mock('uuid', () => ({
  v7: vi.fn(() => 'test-uuid'),
}));

describe('Contexts API', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/contexts', contextsRoute);
    vi.clearAllMocks();
  });

  describe('POST /contexts', () => {
    it('should create a new context successfully', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        slug: 'test-workflow',
        knowledgeId: 'knowledge-123',
      };

      const mockContext = {
        id: 'test-uuid',
        name: 'Test Context',
        slug: 'test-context',
        description: 'Test description',
        workflowId: 'workflow-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      vi.mocked(db.query.workflows.findFirst).mockResolvedValue(mockWorkflow);
      vi.mocked(db.query.contexts.findFirst).mockResolvedValue(null);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockContext]),
        }),
      });

      const res = await app.request('/contexts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-api-key',
        },
        body: JSON.stringify({
          name: 'Test Context',
          description: 'Test description',
          workflowSlug: 'test-workflow',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({
        ...mockContext,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        resources: [],
      });
    });

    it('should return 404 if workflow not found', async () => {
      vi.mocked(db.query.workflows.findFirst).mockResolvedValue(null);

      const res = await app.request('/contexts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-api-key',
        },
        body: JSON.stringify({
          name: 'Test Context',
          workflowSlug: 'non-existent-workflow',
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Workflow not found');
    });

    it('should return 400 if context with same name exists', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        slug: 'test-workflow',
      };

      const existingContext = {
        id: 'existing-context',
        name: 'Test Context',
        slug: 'test-context',
      };

      vi.mocked(db.query.workflows.findFirst).mockResolvedValue(mockWorkflow);
      vi.mocked(db.query.contexts.findFirst).mockResolvedValue(existingContext);

      const res = await app.request('/contexts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-api-key',
        },
        body: JSON.stringify({
          name: 'Test Context',
          workflowSlug: 'test-workflow',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Context with this name already exists');
    });
  });

  describe('GET /contexts/workflow/:workflowSlug', () => {
    it('should return contexts for a workflow', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        slug: 'test-workflow',
      };

      const mockContexts = [
        {
          id: 'context-1',
          name: 'Context 1',
          slug: 'context-1',
          description: 'Description 1',
          workflowId: 'workflow-123',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'context-2',
          name: 'Context 2',
          slug: 'context-2',
          description: 'Description 2',
          workflowId: 'workflow-123',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      const mockResources = [
        {
          id: 'resource-1',
          title: 'Resource 1',
          type: 'URL',
          url: 'https://example.com',
          status: 'COMPLETED',
        },
      ];

      vi.mocked(db.query.workflows.findFirst).mockResolvedValue(mockWorkflow);
      vi.mocked(db.query.contexts.findMany).mockResolvedValue(mockContexts);
      
      // Mock the select chain for resources
      const selectMock = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockResources),
      };
      vi.mocked(db.select).mockReturnValue(selectMock);

      const res = await app.request('/contexts/workflow/test-workflow', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-api-key',
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.contexts).toHaveLength(2);
      expect(data.contexts[0]).toMatchObject({
        id: 'context-1',
        name: 'Context 1',
        resources: mockResources,
      });
    });

    it('should return 404 if workflow not found', async () => {
      vi.mocked(db.query.workflows.findFirst).mockResolvedValue(null);

      const res = await app.request('/contexts/workflow/non-existent', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-api-key',
        },
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Workflow not found');
    });
  });

  describe('GET /contexts/:identifier', () => {
    it('should return context by ID', async () => {
      const mockContext = {
        id: 'context-123',
        name: 'Test Context',
        slug: 'test-context',
        description: 'Test description',
        workflowId: 'workflow-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const mockResources = [
        {
          id: 'resource-1',
          title: 'Resource 1',
          type: 'URL',
          url: 'https://example.com',
          status: 'COMPLETED',
        },
      ];

      vi.mocked(db.query.contexts.findFirst).mockResolvedValue(mockContext);
      
      const selectMock = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockResources),
      };
      vi.mocked(db.select).mockReturnValue(selectMock);

      const res = await app.request('/contexts/context-123', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-api-key',
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toMatchObject({
        id: 'context-123',
        name: 'Test Context',
        resources: mockResources,
      });
    });

    it('should return context by slug', async () => {
      const mockContext = {
        id: 'context-123',
        name: 'Test Context',
        slug: 'test-context',
        description: 'Test description',
        workflowId: 'workflow-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      vi.mocked(db.query.contexts.findFirst)
        .mockResolvedValueOnce(null) // First call returns null (ID not found)
        .mockResolvedValueOnce(mockContext); // Second call returns context (slug found)
      
      const selectMock = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(db.select).mockReturnValue(selectMock);

      const res = await app.request('/contexts/test-context', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-api-key',
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe('context-123');
    });

    it('should return 404 if context not found', async () => {
      vi.mocked(db.query.contexts.findFirst).mockResolvedValue(null);

      const res = await app.request('/contexts/non-existent', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-api-key',
        },
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Context not found');
    });
  });

  describe('PATCH /contexts/:id', () => {
    it('should update context details', async () => {
      const mockContext = {
        id: 'context-123',
        name: 'Updated Context',
        slug: 'updated-context',
        description: 'Updated description',
        workflowId: 'workflow-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      vi.mocked(db.query.contexts.findFirst).mockResolvedValue(mockContext);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
      
      const selectMock = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(db.select).mockReturnValue(selectMock);

      const res = await app.request('/contexts/context-123', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-api-key',
        },
        body: JSON.stringify({
          name: 'Updated Context',
          description: 'Updated description',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe('Updated Context');
      expect(data.description).toBe('Updated description');
    });

    it('should update context resources', async () => {
      const mockContext = {
        id: 'context-123',
        name: 'Test Context',
        slug: 'test-context',
        workflowId: 'workflow-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      vi.mocked(db.query.contexts.findFirst).mockResolvedValue(mockContext);
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
      
      const selectMock = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(db.select).mockReturnValue(selectMock);

      const res = await app.request('/contexts/context-123', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-api-key',
        },
        body: JSON.stringify({
          resourceIds: ['resource-1', 'resource-2'],
        }),
      });

      expect(res.status).toBe(200);
      expect(vi.mocked(db.delete)).toHaveBeenCalled();
      expect(vi.mocked(db.insert)).toHaveBeenCalled();
      expect(vi.mocked(db.update)).toHaveBeenCalled();
    });

    it('should return 404 if context not found', async () => {
      vi.mocked(db.query.contexts.findFirst).mockResolvedValue(null);

      const res = await app.request('/contexts/non-existent', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-api-key',
        },
        body: JSON.stringify({
          name: 'Updated',
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Context not found');
    });
  });
});