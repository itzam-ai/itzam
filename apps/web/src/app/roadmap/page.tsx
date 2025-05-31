"use client";
import {
  Bot,
  Brain,
  Code,
  Gift,
  ImageIcon,
  MessagesSquare,
  Paperclip,
  Ruler,
  Settings,
  ShieldCheck,
  Terminal,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { CTA } from "~/components/landing/cta";
import { Footer } from "~/components/landing/footer";
import { NavBar } from "~/components/landing/navbar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

export default function RoadmapPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-between bg-background px-6 xl:px-0">
      <NavBar />

      <div className="mx-auto flex max-w-4xl pt-32">
        <Roadmap />
      </div>

      <section id="cta" className="pt-24 pb-16">
        <CTA />
      </section>

      <Footer />
    </div>
  );
}

function Roadmap() {
  return (
    <section
      id="roadmap"
      className="flex max-w-4xl flex-col gap-2 px-6 pt-12 pb-16 xl:px-0"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex max-w-[calc(100%-150px)] flex-col gap-2">
          <h1 className="font-semibold text-3xl">Roadmap</h1>
          <p className="text-lg text-muted-foreground">
            Itzam is moving fast. Here&apos;s what&apos;s coming soon.
          </p>
        </div>

        <Button variant="outline">
          <Link href="mailto:founders@itz.am">Request a feature</Link>
        </Button>
      </div>

      <div className="mt-12 flex flex-col">
        <h2 className="text-2xl font-medium">2Q 2025</h2>

        <div className="flex flex-col gap-1">
          <p className="mt-6 flex items-center gap-2.5 text-lg">
            <Code className="size-4 text-orange-600" />
            Structured outputs
            <Badge variant="green">Shipped</Badge>
          </p>

          <p className="text-muted-foreground">Add structured outputs.</p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="mt-6 flex items-center gap-2.5 text-lg">
            <Settings className="size-4 text-orange-600" />
            Model Settings
            <Badge variant="green">Shipped</Badge>
          </p>
          <p className="text-muted-foreground">
            Change the model settings for each workflow (e.g. temperature, max
            tokens, top p).
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="mt-6 flex items-center gap-2.5 text-lg">
            <Gift className="size-4 text-orange-600" />
            Free plan
            <Badge variant="green">Shipped</Badge>
          </p>

          <p className="text-muted-foreground">Try Itzam for free.</p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="mt-6 flex items-center gap-2.5 text-lg">
            <Brain className="size-4 text-orange-600" />
            Knowledge
            <Badge variant="green">Shipped</Badge>
          </p>

          <p className="text-muted-foreground">
            Add knowledge (files, links, etc.) to your workflows.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="mt-6 flex items-center gap-2.5 text-lg">
            <ImageIcon className="size-4 text-orange-600" />
            Image and file input
            <Badge variant="green">Shipped</Badge>
          </p>

          <p className="text-muted-foreground">Allow image and file input.</p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="mt-6 flex items-center gap-2.5 text-lg">
            <MessagesSquare className="size-4 text-orange-600" />
            Threads
            <Badge variant="green">Shipped</Badge>
          </p>

          <p className="text-muted-foreground">
            Add threads (chat history) to your workflows.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="mt-6 flex items-center gap-2.5 text-lg">
            <Paperclip className="size-4 text-orange-600" />
            Context
          </p>
          <p className="text-muted-foreground">
            Add context to your workflows with custom metadata.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-1">
          <p className="flex items-center gap-2.5 text-lg">
            <ShieldCheck className="size-4 text-orange-600" />
            Guardrails
          </p>
          <p className="text-muted-foreground">
            Ship safe and compliant LLM workflows with custom guardrails.
          </p>
        </div>

        <h2 className="mt-16 text-2xl font-medium">3Q 2025</h2>

        <div className="flex flex-col gap-1">
          <p className="mt-6 flex items-center gap-2.5 text-lg">
            <Ruler className="size-4 text-orange-600" />
            Rules
          </p>
          <p className="text-muted-foreground">
            Create and enforce rules in your workflows (e.g. change prompt/model
            based on input, switch current model based on cost).
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-1">
          <p className="flex items-center gap-2.5 text-lg">
            <Bot className="size-4 text-orange-600" />
            Model Fallback
          </p>
          <p className="text-muted-foreground">
            Fallback to a different model if the primary model is down.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="mt-6 flex items-center gap-2.5 text-lg">
            <Terminal className="size-4 text-orange-600" />
            SDK improvements
          </p>

          <p className="text-muted-foreground">
            Add support for more languages.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="mt-6 flex items-center gap-2.5 text-lg">
            <Wrench className="size-4 text-orange-600" />
            Tools
          </p>

          <p className="text-muted-foreground">Add tools to your workflows.</p>
        </div>
      </div>
    </section>
  );
}
