import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bird,
  File,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { Button } from "../ui/button";
import { CodeBlockCode } from "../ui/code-block";
import { Input } from "../ui/input";

interface StarBorderProps {
  as?: React.ElementType;
  className?: string;
  color?: string;
  speed?: string;
  thickness?: number;
  children: React.ReactNode;
  [key: string]: unknown; // Allow any additional props to be passed through
}

const StarBorder = ({
  as: Component = "button",
  className = "",
  color = "white",
  speed = "6s",
  thickness = 1,
  children,
  ...rest
}: StarBorderProps) => {
  const { style, ...otherProps } = rest;
  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-[20px] ${className}`}
      style={{
        padding: `${thickness}px 0`,
        ...(style as React.CSSProperties),
      }}
      {...otherProps}
    >
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      ></div>
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      ></div>
      <div className="relative z-[1] bg-gradient-to-b from-neutral-100 to-neutral-100 dark:from-neutral-900 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-center text-xs py-2 px-4 rounded-[20px]">
        {children}
      </div>
    </Component>
  );
};

export function Hero() {
  const { isSignedIn } = useCurrentUser();

  return (
    <section className="mx-auto max-w-5xl min-h-screen py-24 md:pt-32 pt-48 flex justify-center align-middle flex-col">
      <div className="flex justify-center align-middle max-w-5xl mx-4 md:mx-0 flex-col md:flex-row md:gap-0 gap-24">
        <div className="w-full md:w-1/2 flex flex-col justify-center align-middle text-left">
          <motion.h1
            initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-serif font-medium text-5xl md:text-7xl"
          >
            Open Source
            <br />
            <span className="text-orange-600">Backend for AI</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-2xl text-sm md:text-lg text-muted-foreground mt-4"
          >
            Stop wasting time on <span className="text-primary">RAG</span>,{" "}
            <span className="text-primary">observability</span>, and{" "}
            <span className="text-primary">models</span>.
            <br />
            Manage everything about AI in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 flex gap-x-4 justify-center md:justify-start"
          >
            <Link
              href={isSignedIn ? "/dashboard" : "/auth/login"}
              prefetch={true}
            >
              <Button variant="primary" className="w-40">
                Start Building
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="https://docs.itz.am" target="_blank">
              <Button variant="ghost">Check the docs</Button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="md:w-1/2 w-full flex justify-end"
        >
          <Showcase />
        </motion.div>
      </div>
    </section>
  );
}

const firstAssistantMessage = "Hey! I'm Acme's support agent! Need help?";
const firstUserMessage = "I forgot my password and I can't log in.";
const secondAssistantMessage =
  "Got it, let me help you! I sent a verification code to your email (pg@ycombinator.com).";

export function Showcase() {
  const [userInput, setUserInput] = useState("");

  const code = `
const response = await itzam.streamText({
  input: "${userInput}",
  contextSlugs: ["support-docs"],
  threadId: "thr_424242"
});
  `;

  const [firstUserMessageTyped, setFirstUserMessageTyped] = useState("");
  const [secondAssistantMessageTyped, setSecondAssistantMessageTyped] =
    useState("");

  useEffect(() => {
    simulateTyping(firstUserMessage, 4000, setFirstUserMessageTyped, 40);

    simulateTyping(firstUserMessage, 6000, setUserInput, 30);

    simulateTyping(
      secondAssistantMessage,
      8000,
      setSecondAssistantMessageTyped,
      30
    );
  }, []);

  return (
    <div className="w-full md:max-w-lg max-w-full">
      <div className="mx-auto">
        <div className="dark:bg-card bg-card/70 rounded-3xl border md:ml-10 ml-0 shadow-sm">
          <AcmeFiles />
          <div className="flex gap-4 items-center justify-center">
            <hr className="w-full border-dashed" />
            <ArrowDown className="size-4 min-w-3 text-orange-600" />
            <hr className="w-full border-dashed" />
          </div>

          <CodeBlockCode
            code={code}
            language="typescript"
            style={{
              fontSize: "12px",
            }}
            className="pl-3"
          />
          <div className="flex gap-4 items-center justify-center">
            <hr className="w-full border-dashed" />
            <ArrowDown className="size-4 min-w-3 text-orange-600" />
            <hr className="w-full border-dashed" />
          </div>
          <div className="p-6">
            <h2 className="font-medium flex items-center gap-1.5">
              <Bird className="size-3.5 mb-0.5" strokeWidth={2.2} />
              Acme Chat
            </h2>

            <div className="mt-4 flex flex-col gap-4 min-h-[180px] overflow-y-auto">
              <Message role="assistant" isTyping={false} delay={1.4}>
                <p>{firstAssistantMessage}</p>
              </Message>
              {firstUserMessageTyped && (
                <Message role="user" isTyping={false} delay={0.1}>
                  <p>{firstUserMessageTyped}</p>
                </Message>
              )}
              {secondAssistantMessageTyped && (
                <div className="flex flex-col gap-1">
                  <Message role="assistant" isTyping={false} delay={0.1}>
                    <p>{secondAssistantMessageTyped}</p>
                  </Message>
                  <motion.div
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.3, delay: 3 }}
                    className="w-fit flex items-center gap-1.5 pl-6"
                  >
                    <p className="text-xs text-muted-foreground">Used</p>
                    <div className="flex items-center gap-1 w-fit">
                      <File className="size-2.5 text-muted-foreground" />
                      <p className="text-xs">support-guide.pdf</p>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>

            <div className="relative mt-6">
              <Input
                placeholder="Send a message..."
                className="w-full pr-8 pl-4 h-10 rounded-full"
              />
              <Button
                variant="outline"
                className="rounded-full bg-muted-foreground/50 border-none p-2 size-6 absolute right-2.5 top-1/2 -translate-y-1/2 hover:bg-muted-foreground/60"
              >
                <ArrowUp className="size-3 text-primary" strokeWidth={2.5} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AcmeFiles() {
  return (
    <div className={`flex flex-col gap-3 justify-start items-start p-6 pb-4`}>
      <p className="text-sm font-medium ml-0.5">
        Support Docs{" "}
        <span className="font-mono text-xs text-muted-foreground">
          (support-docs)
        </span>
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="rounded-md bg-muted-foreground/10 py-1 pl-2 pr-2.5 flex items-center gap-1.5 border border-muted-foreground/10">
          <Globe className="size-2.5 text-muted-foreground" />
          <p className="text-xs">acme.com</p>
        </div>
        <div className="rounded-md bg-muted-foreground/10 py-1 pl-2 pr-2.5 flex items-center gap-1.5 border border-muted-foreground/10">
          <Globe className="size-2.5 text-muted-foreground" />
          <p className="text-xs">acme.com/docs/talking-to-customers</p>
        </div>
        <div className="rounded-md bg-muted-foreground/10 py-1 pl-2 pr-2.5 flex items-center gap-1.5 border border-muted-foreground/10">
          <File className="size-2.5 text-muted-foreground" />
          <p className="text-xs">support-guide.pdf</p>
        </div>
        <div className="rounded-md bg-muted-foreground/10 py-1 pl-2 pr-2.5 flex items-center gap-1.5 border border-muted-foreground/10">
          <File className="size-2.5 text-muted-foreground" />
          <p className="text-xs">acme-values.pptx</p>
        </div>
      </div>
    </div>
  );
}

function Message({
  role,
  children,
  isTyping,
  delay,
}: {
  role: string;
  children: React.ReactNode;
  isTyping: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      transition={{ duration: 0.2, delay }}
      className={`flex items-center gap-2 ${
        role === "user" ? "justify-end items-end" : "justify-start items-start"
      }`}
    >
      {isTyping ? (
        <div
          className={`rounded-full text-sm  py-2 max-w-[80%] flex items-start gap-2 ${
            role === "user" ? "bg-muted px-4" : ""
          }`}
        >
          <div className="rounded-full bg-foreground/10 p-1">
            <Bird className="size-2" />
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
            role === "user" ? "bg-muted px-4" : ""
          }`}
        >
          {role === "assistant" && (
            <div className="rounded-full bg-foreground/10 p-1 mt-0.5">
              <Bird className="size-2" />
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
