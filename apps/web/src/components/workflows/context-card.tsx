import { WorkflowWithRelations } from '@itzam/server/db/workflow/actions';
import { ArrowRight, File, FileText, LinkIcon, Text } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Button } from '../ui/button';

export function ContextCard({
  context,
  workflowId,
}: {
  context: Exclude<WorkflowWithRelations, { data: null }>['context'] | undefined;
  workflowId: string;
}) {
  if (!context) {
    return null;
  }

  const hasContextItems =
    context.contextItems && context.contextItems.length > 0;

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 pb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-lg">Context</h3>
          <Link href={ `/dashboard/workflows/${workflowId}/context` }>
            <Button variant="outline" className="gap-2">
              Manage Context
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        { hasContextItems ? (
          <div className="grid gap-2">
            { context.contextItems.map((item) => (
              <div key={ item.id } className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                  { item.type === 'TEXT' && (
                    <Text className="size-4 text-muted-foreground" />
                  ) }
                  { item.type === 'IMAGE' && (
                    <Image
                      src={ item.content }
                      alt={ item.name }
                      width={ 24 }
                      height={ 24 }
                    />
                  ) }
                  { item.type === 'FILE' && (
                    <File className="size-4 text-muted-foreground" />
                  ) }
                  { item.type === 'URL' && (
                    <LinkIcon className="size-4 text-muted-foreground" />
                  ) }
                </div>
                { item.type === 'URL' ? (
                  <Link
                    href={ item.content }
                    className="text-sm underline"
                    target="_blank"
                  >
                    { item.name }
                  </Link>
                ) : (
                  <div className="text-sm">{ item.name }</div>
                ) }
              </div>
            )) }
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mx-auto flex size-8 items-center justify-center rounded-full bg-muted">
              <FileText className="size-4 text-muted-foreground" />
            </div>
            <h4 className="mt-4 font-medium">No context items</h4>
            <p className="mt-1 max-w-md text-muted-foreground text-sm">
              Add context items to provide additional information.
            </p>
          </div>
        ) }
      </CardContent>
    </Card>
  );
}
