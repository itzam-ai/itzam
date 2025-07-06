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
          <h1 className="font-semibold text-4xl font-serif tracking-wide">
            Roadmap
          </h1>
          <p className="text-lg text-muted-foreground">
            Itzam is moving fast. Here&apos;s what&apos;s coming soon.
          </p>
        </div>

        <Button variant="outline">
          <Link href="mailto:founders@itz.am">Request a feature</Link>
        </Button>
      </div>

      <div className="mt-16 grid grid-cols-1 items-start gap-16 md:grid-cols-2">
        <div className="flex flex-col">
          <h2 className="text-xl font-medium">2Q 2025</h2>

          <div className="flex flex-col gap-1">
            <p className="mt-6 flex items-center gap-2.5">
              <Code className="size-3.5 text-neutral-600" />
              Structured outputs
              <span className="text-green-500 text-sm">✔︎</span>
            </p>

            <p className="text-muted-foreground">Add structured outputs.</p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="mt-6 flex items-center gap-2.5 text-base">
              <Settings className="size-3.5 text-neutral-600" />
              Model Settings
              <span className="text-green-500 text-sm">✔︎</span>
            </p>
            <p className="text-muted-foreground">
              Change the model settings for each workflow.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="mt-6 flex items-center gap-2.5 text-base">
              <Gift className="size-3.5 text-neutral-600" />
              Free plan
              <span className="text-green-500 text-sm">✔︎</span>
            </p>

            <p className="text-muted-foreground">Try Itzam for free.</p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="mt-6 flex items-center gap-2.5 text-base">
              <Brain className="size-3.5 text-neutral-600" />
              Knowledge
              <span className="text-green-500 text-sm">✔︎</span>
            </p>

            <p className="text-muted-foreground">
              Add knowledge (files, links, etc.) to your workflows.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="mt-6 flex items-center gap-2.5 text-base">
              <ImageIcon className="size-3.5 text-neutral-600" />
              Image and file input
              <span className="text-green-500 text-sm">✔︎</span>
            </p>

            <p className="text-muted-foreground">Allow image and file input.</p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="mt-6 flex items-center gap-2.5 text-base">
              <MessagesSquare className="size-3.5 text-neutral-600" />
              Threads
              <span className="text-green-500 text-sm">✔︎</span>
            </p>

            <p className="text-muted-foreground">
              Add threads (chat history) to your workflows.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="mt-6 flex items-center gap-2.5 text-base">
              <Paperclip className="size-3.5 text-neutral-600" />
              Context
              <span className="text-green-500 text-sm">✔︎</span>
            </p>
            <p className="text-muted-foreground">
              Add context to your workflows with custom files and links.
            </p>
          </div>
        </div>

        <div className="flex flex-col">
          <h2 className="text-xl font-medium">3Q 2025</h2>

          <div className="flex flex-col gap-1">
            <p className="mt-6 flex items-center gap-2.5 text-base">
              <Wrench className="size-3.5 text-neutral-600" />
              Agents (tools)
            </p>

            <p className="text-muted-foreground">
              Add tools to your workflows.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-1">
            <p className="flex items-center gap-2.5 text-base">
              <Bot className="size-3.5 text-neutral-600" />
              Model Fallback
            </p>
            <p className="text-muted-foreground">
              Fallback to a different model if the primary model is down.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-1">
            <p className="flex items-center gap-2.5 text-base">
              <Bot className="size-3.5 text-neutral-600" />
              Autopilot
            </p>
            <p className="text-muted-foreground">
              Automatically switch model based on prompt.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-1">
            <p className="flex items-center gap-2.5 text-base">
              <ShieldCheck className="size-3.5 text-neutral-600" />
              Guardrails
            </p>
            <p className="text-muted-foreground">
              Ship safe and compliant LLM workflows with guardrails.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="mt-6 flex items-center gap-2.5 text-base">
              <Ruler className="size-3.5 text-neutral-600" />
              Rules
            </p>
            <p className="text-muted-foreground">
              Create rules like cost limits, model switching...
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="mt-6 flex items-center gap-2.5 text-base">
              <Terminal className="size-3.5 text-neutral-600" />
              SDK improvements
            </p>

            <p className="text-muted-foreground">
              Add support for more languages.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
