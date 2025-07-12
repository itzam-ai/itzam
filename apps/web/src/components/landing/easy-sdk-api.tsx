import { Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BorderTrail } from "~/components/ui/border-trail";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { CodeBlockCode } from "../ui/code-block";
import { simulateTyping } from "./hero";
export function EasySDKAPI() {
  const [cycle, setCycle] = useState(0);

  const [typedText, setTypedText] = useState("");
  const fullText = "acme-customer-support";

  const code = `import Itzam from "itzam";

const itzam = new Itzam("api-key");

const response = await itzam.generateText({
  input: "Hey! I'm having trouble with my account.",
  workflowSlug: "${typedText}"
});`;

  useEffect(() => {
    simulateTyping(
      fullText,
      2000,
      setTypedText,
      70,
      () => {},
      () => {
        setTimeout(() => {
          setTypedText("");
          setCycle((c) => c + 1);
        }, 7000);
      },
    );
  }, [cycle]);

  return (
    <Card className="relative px-4 py-4 shadow-sm">
      <BorderTrail
        color="neutral"
        duration={20}
        size={0}
        style={{
          boxShadow:
            "0px 0px 60px 30px rgb(128 128 128 / 50%), 0 0 100px 60px rgb(96 96 96 / 50%), 0 0 140px 90px rgb(64 64 64 / 50%)",
        }}
      />
      <CodeBlockCode code={code} language="typescript" />
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 right-6"
        onClick={() => {
          navigator.clipboard.writeText(code);
          toast.success("Happy coding!");
        }}
      >
        <Copy className="size-3" strokeWidth={2.5} />
      </Button>
    </Card>
  );
}
