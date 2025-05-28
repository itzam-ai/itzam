"use client";

import { getRunById, RunWithModel } from "@itzam/server/db/run/actions";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";
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
    <motion.div
      initial={{ height: 0, opacity: 0, scale: 0.99 }}
      animate={{ height: "auto", opacity: 1, scale: 1 }}
      exit={{ height: 0, opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="grid grid-cols-3 gap-8">
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
            <p className="mt-1 text-sm">
              {run?.runResources.map((resource) => resource.resource.title)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
