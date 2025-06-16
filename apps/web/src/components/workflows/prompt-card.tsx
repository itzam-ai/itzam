"use client";
import { LetterText } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "../ui/button";

export function PromptCard({
  prompt,
  workflowId,
}: {
  prompt: string;
  workflowId: string;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <p>Prompt</p>
          <LetterText className="size-4 text-muted-foreground/50" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="line-clamp-[12] flex-1 whitespace-pre-wrap break-words font-mono text-muted-foreground text-xs">
          {prompt}
        </p>
        <div className="mt-2 flex justify-end">
          <Link href={`/dashboard/workflows/${workflowId}/prompt`}>
            <Button size="sm" variant="outline" className="mt-3">
              Edit
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
