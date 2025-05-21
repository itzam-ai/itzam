import { createApiKey } from "@itzam/server/db/api-keys/actions";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { simulateTyping } from "../landing/hero";
import { Button } from "../ui/button";
import { CodeBlockCode } from "../ui/code-block";
import { MiniWorkflow } from "./workflow-step";
import { cn } from "~/lib/utils";

export const IntegrationStep = ({
  handleNextStep,
  workflow,
}: {
  handleNextStep: () => void;
  workflow: MiniWorkflow | null;
}) => {
  const { resolvedTheme } = useTheme();

  const [functionName, setFunctionName] = useState<
    "generateText" | "streamText"
  >("generateText");
  const [apiKey, setApiKey] = useState("");
  const [apiKeyTyped, setApiKeyTyped] = useState("");
  const [isCreatingApiKey, setIsCreatingApiKey] = useState(false);

  const code = `
const itzam = new Itzam(
  "${apiKeyTyped}"
);

const response = await itzam.${functionName}({
  input: "Hello, how are you?",
  workflowSlug: "${workflow?.slug}"
});
    `;

  const handleCreateApiKey = async () => {
    setIsCreatingApiKey(true);
    const apiKey = await createApiKey("Onboarding API key");

    simulateTyping(
      apiKey.plainKey ?? "",
      0,
      setApiKeyTyped,
      40,
      setIsCreatingApiKey
    );

    setApiKey(apiKey.plainKey ?? "");
    setIsCreatingApiKey(false);
  };

  return (
    <div className="max-w-xl w-full">
      <h2 className="text-2xl font-medium flex items-center gap-2">
        Integrate!
      </h2>
      <p className="text-muted-foreground mt-1">
        Create an API key and you&apos;re good to go!
      </p>

      <div className="flex flex-col gap-8 mt-8">
        <div className="flex flex-col gap-2">
          <p className="font-medium text-sm ml-1">API Key</p>

          <div className="border rounded-xl dark:bg-muted/20 bg-card/20 overflow-hidden relative p-2">
            <AnimatePresence>
              {!apiKey ? (
                <motion.div
                  className="flex items-center justify-center"
                  initial={{
                    opacity: 0,
                    filter: "blur(4px)",
                  }}
                  animate={{
                    opacity: 1,
                    filter: "blur(0px)",
                  }}
                  exit={{
                    opacity: 0,
                    filter: "blur(4px)",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-28"
                    onClick={handleCreateApiKey}
                    disabled={isCreatingApiKey}
                  >
                    {isCreatingApiKey ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      "Create API key"
                    )}
                  </Button>
                </motion.div>
              ) : (
                <div className="flex items-center justify-center p-4">
                  <motion.p
                    className="font-mono"
                    style={{
                      fontSize: "12px",
                    }}
                    initial={{ opacity: 0, filter: "blur(4px)", height: "0px" }}
                    animate={{
                      opacity: 1,
                      filter: "blur(0px)",
                      height: "auto",
                    }}
                    exit={{ opacity: 0, filter: "blur(4px)", height: "0px" }}
                    transition={{ duration: 0.2 }}
                  >
                    {apiKey}
                  </motion.p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4"
                    onClick={() => {
                      navigator.clipboard.writeText(apiKey);
                      toast.success("Copied to clipboard!");
                    }}
                  >
                    <Copy className="size-3" strokeWidth={2.5} />
                  </Button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-medium text-sm ml-1">
            Here&apos;s how to use your workflow:
          </p>
          <div className="border rounded-xl dark:bg-muted/20 bg-card/30 relative">
            <div className="flex items-center border-b">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full rounded-none rounded-tl-xl py-4 active:scale-100",
                  functionName === "generateText" && "bg-accent"
                )}
                onClick={() => setFunctionName("generateText")}
              >
                Generate text
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full rounded-none rounded-tr-xl border-l py-4 active:scale-100",
                  functionName === "streamText" && "bg-accent"
                )}
                onClick={() => setFunctionName("streamText")}
              >
                Stream text
              </Button>
            </div>
            <div className="py-1">
              <CodeBlockCode
                code={code}
                language="typescript"
                theme={resolvedTheme === "dark" ? "vesper" : "github-light"}
                style={{
                  fontSize: "12px",
                  overflow: "hidden",
                }}
                className="whitespace-pre-wrap overflow-hidden"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-4 right-4"
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  toast.success("Happy coding!");
                }}
              >
                <Copy className="size-3" strokeWidth={2.5} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-12 items-center">
        <p className="text-muted-foreground/60 text-xs flex items-center gap-1">
          Check the{" "}
          <Link
            href="https://docs.itz.am"
            target="_blank"
            className="font-medium underline hover:text-foreground text-muted-foreground transition-colors flex items-center gap-1 duration-200"
          >
            docs <ExternalLink className="size-3" strokeWidth={2.5} />
          </Link>{" "}
          for other snippets.
        </p>
        <Button
          variant="primary"
          size="sm"
          className="w-20"
          onClick={handleNextStep}
        >
          Finish
          <Check className="size-3" strokeWidth={2.5} />
        </Button>
      </div>
    </div>
  );
};
