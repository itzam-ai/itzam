"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

export function WorkflowTabs({ id }: { id: string }) {
  const pathname = usePathname();

  // Determine which tab is active based on the current path
  const getActiveTab = () => {
    if (pathname.includes("/runs")) {
      return "runs";
    }
    if (pathname.includes("/model")) {
      return "model";
    }
    if (pathname.includes("/prompt")) {
      return "prompt";
    }
    if (pathname.includes("/playground")) {
      return "playground";
    }
    if (pathname.includes("/knowledge")) {
      return "knowledge";
    }
    return "summary";
  };

  return (
    <Tabs value={getActiveTab()} className="mb-6 w-full">
      <TabsList className="mb-6 grid grid-cols-6">
        <Link prefetch href={`/dashboard/workflows/${id}`} className="w-full">
          <TabsTrigger value="summary" className="w-full">
            <span className="z-10">Summary</span>
            <SlidingDecorator tab="summary" activeTab={getActiveTab()} />
          </TabsTrigger>
        </Link>
        <Link
          prefetch
          href={`/dashboard/workflows/${id}/model`}
          className="w-full"
        >
          <TabsTrigger value="model" className="w-full">
            <span className="z-10">Model</span>
            <SlidingDecorator tab="model" activeTab={getActiveTab()} />
          </TabsTrigger>
        </Link>
        <Link
          prefetch
          href={`/dashboard/workflows/${id}/prompt`}
          className="w-full"
        >
          <TabsTrigger value="prompt" className="w-full">
            <span className="z-10">Prompt</span>
            <SlidingDecorator tab="prompt" activeTab={getActiveTab()} />
          </TabsTrigger>
        </Link>
        <Link
          prefetch
          href={`/dashboard/workflows/${id}/knowledge`}
          className="w-full"
        >
          <TabsTrigger value="knowledge" className="w-full">
            <span className="z-10">Knowledge</span>
            <SlidingDecorator tab="knowledge" activeTab={getActiveTab()} />
          </TabsTrigger>
        </Link>
        <Link
          prefetch
          href={`/dashboard/workflows/${id}/runs`}
          className="w-full"
        >
          <TabsTrigger value="runs" className="w-full">
            <span className="z-10">Runs</span>
            <SlidingDecorator tab="runs" activeTab={getActiveTab()} />
          </TabsTrigger>
        </Link>
        <Link
          prefetch
          href={`/dashboard/workflows/${id}/playground`}
          className="w-full"
        >
          <TabsTrigger value="playground" className="w-full">
            <span className="z-10">Playground</span>
            <SlidingDecorator tab="playground" activeTab={getActiveTab()} />
          </TabsTrigger>
        </Link>
      </TabsList>
    </Tabs>
  );
}

export function SlidingDecorator({
  tab,
  activeTab,
}: {
  tab: string;
  activeTab: string;
}) {
  return (
    tab === activeTab && (
      <motion.div
        layoutId="underline-tabs"
        id="underline"
        className="absolute bottom-0 left-0 h-full w-full rounded-md bg-background dark:bg-muted-foreground/20 pointer-events-none shadow"
      />
    )
  );
}
