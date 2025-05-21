"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "../ui/badge";

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
          // href={`/dashboard/workflows/${id}/prompts`}
          href="#"
          className="w-full cursor-not-allowed"
          onClick={(e) => e.preventDefault()}
        >
          <TabsTrigger
            value="prompt"
            className="w-full opacity-50"
            disabled={true}
          >
            Prompt{" "}
            <Badge variant="outline" size="xs" className="ml-2">
              Soon
            </Badge>
          </TabsTrigger>
        </Link>
        <Link
          prefetch
          href={`/dashboard/workflows/${id}/knowledge`}
          className="w-full"
        >
          <TabsTrigger value="knowledge" className="w-full">
            Knowledge{" "}
            <Badge variant="green" size="xs" className="ml-2">
              New
            </Badge>
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
