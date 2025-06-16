import { motion } from "framer-motion";
import { ArrowRight, ArrowUp, Bird } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import ModelIcon from "public/models/svgs/model-icon";
import { useEffect, useState } from "react";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { Button } from "../ui/button";
import { CodeBlockCode } from "../ui/code-block";
import { Input } from "../ui/input";
import { TextLoop } from "../ui/text-loop";

const heroModels = [
  {
    icon: <ModelIcon tag="anthropic:claude-3-7-sonnet" size="lg" />,
    name: <p className="text-[#D97757]">Claude</p>,
  },
  {
    icon: <ModelIcon tag="openai:gpt-4o" size="lg" />,
    name: <p className="text-foreground">GPT</p>,
  },
  {
    icon: <ModelIcon tag="google:gemini-2.0-flash" size="lg" />,
    name: (
      <p className="bg-gradient-to-tr from-[#1C7DFF] via-[#1C69FF] to-[#F0DCD6] via-50% text-transparent bg-clip-text">
        Gemini
      </p>
    ),
  },
  {
    icon: <ModelIcon tag="xai:grok-2-vision-1212" size="lg" />,
    name: <p className="text-foreground">Grok</p>,
  },
  {
    icon: <ModelIcon tag="mistral:mistral-large-latest" size="lg" />,
    name: (
      <p className="bg-gradient-to-b from-[#F7D046] via-[#EE792F] to-[#EA3326] via-50% text-transparent bg-clip-text">
        Mistral
      </p>
    ),
  },
  {
    icon: <ModelIcon tag="deepseek:deepseek-chat" size="lg" />,
    name: <p className="text-[#4D6BFE]">DeepSeek</p>,
  },
  {
    icon: <ModelIcon tag="cohere:command-r-plus" size="lg" />,
    name: <p className="text-[#39594D]">Command</p>,
  },
];

const heroModelsMobile = [
  {
    icon: <ModelIcon tag="anthropic:claude-3-7-sonnet" size="md" />,
    name: <p className="text-[#D97757]">Claude</p>,
  },
  {
    icon: <ModelIcon tag="openai:gpt-4o" size="md" />,
    name: <p className="text-foreground">GPT</p>,
  },
  {
    icon: <ModelIcon tag="google:gemini-2.0-flash" size="md" />,
    name: (
      <p className="bg-gradient-to-tr from-[#1C7DFF] via-[#1C69FF] to-[#F0DCD6] via-50% text-transparent bg-clip-text">
        Gemini
      </p>
    ),
  },
  {
    icon: <ModelIcon tag="xai:grok-2-vision-1212" size="md" />,
    name: <p className="text-foreground">Grok</p>,
  },
  {
    icon: <ModelIcon tag="mistral:mistral-large-latest" size="md" />,
    name: (
      <p className="bg-gradient-to-b from-[#F7D046] via-[#EE792F] to-[#EA3326] via-50% text-transparent bg-clip-text">
        Mistral
      </p>
    ),
  },
  {
    icon: <ModelIcon tag="deepseek:deepseek-chat" size="md" />,
    name: <p className="text-[#4D6BFE]">DeepSeek</p>,
  },
  {
    icon: <ModelIcon tag="cohere:command-r-plus" size="md" />,
    name: <p className="text-[#39594D]">Command</p>,
  },
];

export function Hero() {
  const { isSignedIn } = useCurrentUser();

  return (
    <section className="mx-auto max-w-6xl min-h-screen py-24 md:pt-32 pt-48 flex justify-center align-middle flex-col">
      <div className="flex justify-center align-middle max-w-6xl mx-4 md:mx-8 flex-col md:flex-row md:gap-0 gap-24">
        <div className="w-full md:w-1/2 flex flex-col justify-center align-middle text-center md:text-left">
          <motion.h1
            initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-medium text-3xl md:text-5xl"
          >
            Integrate
            <TextLoop
              className="text-primary ml-4 hidden md:inline-flex"
              transition={{ duration: 0.3 }}
              interval={3.5}
            >
              {heroModels.map((model, index) => (
                <span className="flex items-center gap-2.5" key={index}>
                  {model.icon}
                  {model.name}
                </span>
              ))}
            </TextLoop>
            <TextLoop
              className="text-primary ml-3 inline-flex md:hidden"
              transition={{ duration: 0.3 }}
              interval={3.5}
            >
              {heroModelsMobile.map((model, index) => (
                <span className="flex items-center gap-1.5 h-8" key={index}>
                  {model.icon}
                  {model.name}
                </span>
              ))}
            </TextLoop>
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-medium text-3xl md:text-5xl md:mt-2 mt-1 flex items-center gap-1 justify-center md:justify-start"
          >
            with 4 lines of code
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl text-base md:text-lg text-muted-foreground md:mt-6 mt-4"
          >
            Itzam is the <span className="hidden md:inline">easiest</span> way
            to integrate AI into your app.
            <br />
            Manage prompts, models, billing, and more.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 flex gap-x-4 justify-center md:justify-start"
          >
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button variant="primary" className="w-40">
                  Start Building
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login" prefetch={true}>
                <Button variant="primary" className="w-40">
                  Start Building
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            )}
            <Link href="https://cal.com/gustavo-fior/30min" target="_blank">
              <Button variant="ghost">Schedule a demo</Button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="md:w-1/2 w-full flex justify-end"
        >
          <Showcase />
        </motion.div>
      </div>
    </section>
  );
}

const firstAssistantMessage = "Hey 😃, I'm Acme's support agent! Need help?";
const firstUserMessage = "I forgot my password and I can't log in.";
const secondAssistantMessage =
  "Got it, let me help you! I sent a verification code to your email (paulg@yc.com).";

export function Showcase() {
  const [userInput, setUserInput] = useState("");

  const code = `
const itzam = new Itzam("api-key");

const response = await itzam.generateText({
  input: "${userInput}",
  workflowSlug: "support-chat"
});
  `;

  const { resolvedTheme } = useTheme();

  const [firstUserMessageTyped, setFirstUserMessageTyped] = useState("");
  const [secondAssistantMessageTyped, setSecondAssistantMessageTyped] =
    useState("");

  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    simulateTyping(firstUserMessage, 4000, setFirstUserMessageTyped, 40);

    simulateTyping(firstUserMessage, 6000, setUserInput, 30);

    simulateTyping(
      secondAssistantMessage,
      8000,
      setSecondAssistantMessageTyped,
      40,
      setIsTyping
    );
  }, []);

  return (
    <div className="w-full md:max-w-lg max-w-full ">
      <div className="mx-auto">
        <div className="p-4 dark:bg-card bg-card/70 rounded-t-3xl border md:mx-8 mx-4 border-b-0 shadow-sm">
          <div className="p-2">
            <h2 className="font-medium text-center flex items-center gap-1.5 justify-center">
              <Bird className="size-3.5 mb-0.5" />
              Acme Support
            </h2>

            <div className="mt-6 flex flex-col gap-4 min-h-[200px] overflow-y-auto">
              <Message role="assistant" isTyping={false}>
                <p>{firstAssistantMessage}</p>
              </Message>
              {firstUserMessageTyped && (
                <Message role="user" isTyping={false}>
                  <p>{firstUserMessageTyped}</p>
                </Message>
              )}
              {(secondAssistantMessageTyped || isTyping) && (
                <Message role="assistant" isTyping={isTyping}>
                  <p>{secondAssistantMessageTyped}</p>
                </Message>
              )}
            </div>

            <div className="relative mt-6 mb-2">
              <Input
                placeholder="Send a message..."
                className="w-full pr-12 pl-6 h-12 rounded-full"
              />
              <Button
                variant="outline"
                className="rounded-full bg-primary border-none p-2 size-6 absolute right-3 top-1/2 -translate-y-1/2 hover:bg-primary/80"
              >
                <ArrowUp className="size-3 text-background" strokeWidth={2.5} />
              </Button>
            </div>
          </div>
        </div>

        <div className="border rounded-3xl dark:bg-muted/50 bg-card p-2 shadow-sm">
          <CodeBlockCode
            code={code}
            language="typescript"
            theme={resolvedTheme === "dark" ? "vesper" : "github-light"}
          />
        </div>
      </div>
    </div>
  );
}

function Message({
  role,
  children,
  isTyping,
}: {
  role: string;
  children: React.ReactNode;
  isTyping: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      transition={{ duration: 0.2, delay: role === "user" ? 0.2 : 1.4 }}
      className={`flex items-center gap-2 ${
        role === "user" ? "justify-end items-end" : "justify-start items-start"
      }`}
    >
      {isTyping ? (
        <div
          className={`rounded-full text-sm px-4 py-2 max-w-[80%] flex items-start gap-2 ${
            role === "user" ? "bg-muted" : ""
          }`}
        >
          <div className="rounded-full bg-foreground/10 p-1">
            <Bird className="size-2.5" />
          </div>
          <div className="flex gap-1 items-center mt-2">
            <div className="size-2 bg-muted rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="size-2 bg-muted rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="size-2 bg-muted rounded-full animate-bounce" />
          </div>
        </div>
      ) : (
        <div
          className={`rounded-full text-sm py-2 max-w-[80%] flex items-start gap-2 ${
            role === "user" ? "bg-muted px-4" : "md:px-4 px-2"
          }`}
        >
          {role === "assistant" && (
            <div className="rounded-full bg-foreground/10 p-1 mt-0.5">
              <Bird className="size-2.5" />
            </div>
          )}
          {children}
        </div>
      )}
    </motion.div>
  );
}

export function simulateTyping(
  text: string,
  delay: number,
  setText: (text: string) => void,
  speed?: number,
  setIsTyping?: (isTyping: boolean) => void,
  onFinish?: () => void
) {
  let currentIndex = 0;

  const typeNextChar = () => {
    if (currentIndex < text.length) {
      if (currentIndex === 0) {
        setIsTyping?.(true);
      }

      setText(text.slice(0, currentIndex + 1));
      currentIndex++;

      // Random typing speed between 50ms and 150ms for natural feel
      const typingSpeed = speed || Math.random() * 100;
      setTimeout(typeNextChar, typingSpeed);
    } else {
      setIsTyping?.(false);
      onFinish?.();
    }
  };

  setTimeout(typeNextChar, delay);
}
