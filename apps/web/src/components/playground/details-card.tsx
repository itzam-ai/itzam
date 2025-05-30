"use client";

import { getRunById, RunWithModel } from "@itzam/server/db/run/actions";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";
import { File, Globe } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// Type for the metadata returned by the stream
type StreamMetadata = {
  runId: string;
  model: {
    name: string;
    tag: string;
  };
  inputTokens: number;
  outputTokens: number;
  durationInMs: number;
  cost: string;
};

export function DetailsCard({
  metadata,
}: {
  metadata?: StreamMetadata | null;
}) {
  const [run, setRun] = useState<RunWithModel | null>(null);

  // when runId changes, fetch the run to retrieve knowledge used
  useEffect(() => {
    const fetchRun = async () => {
      if (metadata?.runId) {
        const run = await getRunById(metadata.runId);
        setRun(run ?? null);
      }
    };
    fetchRun();
  }, [metadata?.runId]);

  return (
    <motion.div>
      <div className="grid grid-cols-3 pl-4 pt-2">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h4 className="text-muted-foreground text-sm">Input Tokens</h4>
            <p className="mt-1 text-sm">
              <NumberFlow value={metadata?.inputTokens ?? 0} />
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <h4 className="text-muted-foreground text-sm">Cost</h4>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm">
                <NumberFlow
                  value={Number(metadata?.cost ?? 0)}
                  format={{
                    currency: "USD",
                    maximumFractionDigits: 6,
                    minimumFractionDigits: 2,
                  }}
                  prefix="$"
                />
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h4 className="text-muted-foreground text-sm">Output Tokens</h4>
            <p className="mt-1 text-sm">
              <NumberFlow value={metadata?.outputTokens ?? 0} />
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <h4 className="text-muted-foreground text-sm">Duration</h4>
            <div className="mt-1">
              <p className="text-sm">
                <NumberFlow value={metadata?.durationInMs ?? 0} suffix="ms" />
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h4 className="text-muted-foreground text-sm">Knowledge</h4>
            <div className="mt-1 text-sm flex flex-col gap-1">
              {run && run?.runResources.length > 0 ? (
                run?.runResources.map((resource) => (
                  <div
                    key={resource.resource.id}
                    className="flex gap-1.5 items-center text-sm text-muted-foreground cursor-pointer hover:opacity-80 transition-opacity duration-200"
                  >
                    {resource.resource.type === "LINK" ? (
                      <Globe className="size-3" />
                    ) : (
                      <File className="size-3" />
                    )}
                    <Link
                      href={resource.resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary truncate"
                    >
                      {resource.resource.title}
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-sm">-</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
