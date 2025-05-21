'use client';

import { deleteApiKey } from '@itzam/server/db/api-keys/actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Spinner } from '../ui/spinner';

export function DeleteApiKeyDialog({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function onSubmit() {
    try {
      setIsLoading(true);
      await deleteApiKey(id);
      toast.success('API key deleted');
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error('Error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={ open } onOpenChange={ setOpen }>
      <DialogTrigger asChild>{ children }</DialogTrigger>
      <DialogContent
        className="!focus:outline-none !focus:ring-0 sm:max-w-[400px]"
        style={ { outline: 'none' } }
        tabIndex={ -1 }
      >
        <DialogHeader>
          <DialogTitle>Delete API Key</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this API key? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={ () => setOpen(false) } size="sm">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={ onSubmit }
            disabled={ isLoading }
            size="sm"
            className="w-20"
          >
            { isLoading ? <Spinner /> : 'Delete' }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
