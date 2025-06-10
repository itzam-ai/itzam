import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateContextDialog } from '../create-context-dialog';
import { createContext } from '@itzam/server/actions/contexts';
import { toast } from 'sonner';

// Mock the server action
vi.mock('@itzam/server/actions/contexts', () => ({
  createContext: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CreateContextDialog', () => {
  const mockWorkflowId = 'workflow-123';
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dialog trigger button', () => {
    render(<CreateContextDialog workflowId={mockWorkflowId} />);
    
    expect(screen.getByRole('button', { name: /create context/i })).toBeInTheDocument();
  });

  it('renders custom trigger when provided', () => {
    const customTrigger = <button>Custom Trigger</button>;
    render(<CreateContextDialog workflowId={mockWorkflowId} trigger={customTrigger} />);
    
    expect(screen.getByText('Custom Trigger')).toBeInTheDocument();
  });

  it('opens dialog when trigger is clicked', async () => {
    render(<CreateContextDialog workflowId={mockWorkflowId} />);
    
    await user.click(screen.getByRole('button', { name: /create context/i }));
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create Context')).toBeInTheDocument();
    expect(screen.getByText(/create a new context to organize your resources/i)).toBeInTheDocument();
  });

  it('displays form fields when dialog is open', async () => {
    render(<CreateContextDialog workflowId={mockWorkflowId} />);
    
    await user.click(screen.getByRole('button', { name: /create context/i }));
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/slug/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('auto-generates slug from name', async () => {
    render(<CreateContextDialog workflowId={mockWorkflowId} />);
    
    await user.click(screen.getByRole('button', { name: /create context/i }));
    
    const nameInput = screen.getByLabelText(/name/i);
    const slugInput = screen.getByLabelText(/slug/i);
    
    await user.type(nameInput, 'Production Data');
    
    expect(slugInput).toHaveValue('production-data');
  });

  it('handles special characters in slug generation', async () => {
    render(<CreateContextDialog workflowId={mockWorkflowId} />);
    
    await user.click(screen.getByRole('button', { name: /create context/i }));
    
    const nameInput = screen.getByLabelText(/name/i);
    const slugInput = screen.getByLabelText(/slug/i);
    
    await user.type(nameInput, 'Test @ Context #123!');
    
    expect(slugInput).toHaveValue('test-context-123');
  });

  it('validates required fields', async () => {
    render(<CreateContextDialog workflowId={mockWorkflowId} />);
    
    await user.click(screen.getByRole('button', { name: /create context/i }));
    
    const submitButton = screen.getByRole('button', { name: /^create context$/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('validates slug format', async () => {
    render(<CreateContextDialog workflowId={mockWorkflowId} />);
    
    await user.click(screen.getByRole('button', { name: /create context/i }));
    
    const nameInput = screen.getByLabelText(/name/i);
    const slugInput = screen.getByLabelText(/slug/i);
    
    await user.type(nameInput, 'Test');
    await user.clear(slugInput);
    await user.type(slugInput, 'Invalid Slug!');
    
    const submitButton = screen.getByRole('button', { name: /^create context$/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/slug must be lowercase letters/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    vi.mocked(createContext).mockResolvedValueOnce({
      id: 'context-123',
      name: 'Production Data',
      slug: 'production-data',
      description: 'Test description',
      workflowId: mockWorkflowId,
    });

    render(<CreateContextDialog workflowId={mockWorkflowId} />);
    
    await user.click(screen.getByRole('button', { name: /create context/i }));
    
    await user.type(screen.getByLabelText(/name/i), 'Production Data');
    await user.type(screen.getByLabelText(/description/i), 'Test description');
    
    const submitButton = screen.getByRole('button', { name: /^create context$/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(createContext).toHaveBeenCalledWith({
        name: 'Production Data',
        slug: 'production-data',
        description: 'Test description',
        workflowId: mockWorkflowId,
      });
      expect(toast.success).toHaveBeenCalledWith('Context created successfully');
    });
  });

  it('handles submission errors', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(createContext).mockRejectedValueOnce(new Error('API Error'));

    render(<CreateContextDialog workflowId={mockWorkflowId} />);
    
    await user.click(screen.getByRole('button', { name: /create context/i }));
    
    await user.type(screen.getByLabelText(/name/i), 'Test Context');
    
    const submitButton = screen.getByRole('button', { name: /^create context$/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create context');
    });

    consoleErrorSpy.mockRestore();
  });

  it('disables submit button while loading', async () => {
    vi.mocked(createContext).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<CreateContextDialog workflowId={mockWorkflowId} />);
    
    await user.click(screen.getByRole('button', { name: /create context/i }));
    
    await user.type(screen.getByLabelText(/name/i), 'Test Context');
    
    const submitButton = screen.getByRole('button', { name: /^create context$/i });
    await user.click(submitButton);
    
    expect(submitButton).toBeDisabled();
    // Check for the Loader2 icon with the animate-spin class
    expect(submitButton.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('closes dialog and resets form on successful submission', async () => {
    vi.mocked(createContext).mockResolvedValueOnce({
      id: 'context-123',
      name: 'Test Context',
      slug: 'test-context',
      workflowId: mockWorkflowId,
    });

    render(<CreateContextDialog workflowId={mockWorkflowId} />);
    
    await user.click(screen.getByRole('button', { name: /create context/i }));
    
    await user.type(screen.getByLabelText(/name/i), 'Test Context');
    
    const submitButton = screen.getByRole('button', { name: /^create context$/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Re-open dialog to check form was reset
    await user.click(screen.getByRole('button', { name: /create context/i }));
    
    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/slug/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
  });

  it('closes dialog when cancel button is clicked', async () => {
    render(<CreateContextDialog workflowId={mockWorkflowId} />);
    
    await user.click(screen.getByRole('button', { name: /create context/i }));
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});