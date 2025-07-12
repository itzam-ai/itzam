"use client";

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
    if (pathname.includes("/tools")) {
      return "tools";
    }
    return "summary";
  };

  return (
    <Tabs value={getActiveTab()} className="mb-6 w-full">
      <TabsList className="mb-6 grid grid-cols-7">
        <Link prefetch href={`/dashboard/workflows/${id}`} className="w-full">
          <TabsTrigger value="summary" className="w-full">
            Summary
          </TabsTrigger>
        </Link>
        <Link
          prefetch
          href={`/dashboard/workflows/${id}/model`}
          className="w-full"
        >
          <TabsTrigger value="model" className="w-full">
            Model
          </TabsTrigger>
        </Link>
        <Link
          prefetch
          href={`/dashboard/workflows/${id}/prompt`}
          className="w-full"
        >
          <TabsTrigger value="prompt" className="w-full">
            Prompt
          </TabsTrigger>
        </Link>
        <Link
          prefetch
          href={`/dashboard/workflows/${id}/knowledge`}
          className="w-full"
        >
          <TabsTrigger value="knowledge" className="w-full">
            Knowledge
          </TabsTrigger>
        </Link>
        <Link
          prefetch
          href={`/dashboard/workflows/${id}/tools`}
          className="w-full"
        >
          <TabsTrigger value="tools" className="w-full">
            Tools
          </TabsTrigger>
        </Link>
        <Link
          prefetch
          href={`/dashboard/workflows/${id}/runs`}
          className="w-full"
        >
          <TabsTrigger value="runs" className="w-full">
            Runs
          </TabsTrigger>
        </Link>
        <Link
          prefetch
          href={`/dashboard/workflows/${id}/playground`}
          className="w-full"
        >
          <TabsTrigger value="playground" className="w-full">
            Playground
          </TabsTrigger>
        </Link>
      </TabsList>
    </Tabs>
  );
}
