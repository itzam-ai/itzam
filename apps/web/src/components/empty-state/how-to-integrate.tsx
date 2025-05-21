"use client";

import { useTheme } from "next-themes";
import { CodeBlockCode } from "../ui/code-block";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export const HowToIntegrate = ({ workflowSlug }: { workflowSlug: string }) => {
  const { resolvedTheme } = useTheme();
  const generateTextCode = `
// Generate text: 

import Itzam from "itzam";

const itzam = new Itzam("api-key");

const response = await itzam.generateText({
  input: "Hey! I'm having trouble with my account.",
  workflowSlug: "${workflowSlug}"
});`;

  const streamTextCode = `// Stream text: 
  
import Itzam from "itzam";

const itzam = new Itzam("api-key");

const response = await itzam.streamText({
  input: "Hey! I'm having trouble with my account.",
  workflowSlug: "${workflowSlug}"
});`;

  return (
    <>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-medium">How to integrate</h2>
      </div>

      <div className="flex justify-center gap-4">
        <Card className="w-full p-2 relative">
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(generateTextCode);
                toast.success("Happy coding!");
              }}
            >
              <Copy className="size-3" />
            </Button>
          </div>

          <CodeBlockCode
            code={generateTextCode}
            style={{
              fontSize: "12px",
            }}
            language="typescript"
            theme={resolvedTheme === "dark" ? "vesper" : "github-light"}
          />
        </Card>
        <Card className="w-full p-2 relative">
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(streamTextCode);
                toast.success("Happy coding!");
              }}
            >
              <Copy className="size-3" />
            </Button>
          </div>
          <CodeBlockCode
            code={streamTextCode}
            style={{
              fontSize: "12px",
            }}
            language="typescript"
            theme={resolvedTheme === "dark" ? "vesper" : "github-light"}
          />
        </Card>
      </div>
    </>
  );
};
