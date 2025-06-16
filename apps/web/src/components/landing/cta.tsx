"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import ModelIcon from "public/models/svgs/model-icon";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { Button } from "../ui/button";
import { TextLoop } from "../ui/text-loop";

const ctaModels = [
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

const ctaModelsMobile = [
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

export const CTA = () => {
  const { isSignedIn } = useCurrentUser();

  return (
    <div className="flex max-w-2xl flex-col items-center justify-between gap-8 md:max-w-4xl md:flex-row">
      <div className="flex flex-col gap-2">
        <h2 className="flex gap-3 font-medium text-2xl text-muted-foreground md:text-4xl">
          Integrate
          <TextLoop
            className="text-primary hidden md:inline-flex"
            transition={{ duration: 0.3 }}
            interval={3.5}
          >
            {ctaModels.map((model, index) => (
              <div className="flex items-center gap-2.5" key={index}>
                {model.icon}
                {model.name}
              </div>
            ))}
          </TextLoop>
          <TextLoop
            className="text-primary md:hidden inline-flex"
            transition={{ duration: 0.3 }}
            interval={3.5}
          >
            {ctaModelsMobile.map((model, index) => (
              <div className="flex items-center gap-1.5" key={index}>
                {model.icon}
                {model.name}
              </div>
            ))}
          </TextLoop>
        </h2>
        <p className="font-medium text-2xl text-muted-foreground md:text-4xl">
          in 2 minutes{" "}
          <i className="text-muted-foreground/50 italic">or less</i>
        </p>
      </div>
      <div className="mx-auto mt-4 flex gap-4 md:mx-0">
        <Link href="https://docs.itz.am">
          <Button variant="secondary" size="lg">
            Docs
          </Button>
        </Link>
        {isSignedIn ? (
          <Link href="/dashboard">
            <Button size="lg" variant="primary" className="w-48">
              Start Building
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/auth/login" prefetch={true}>
            <Button size="lg" variant="primary" className="w-48">
              Start Building
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
