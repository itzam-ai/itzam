'use client';

import { RunWithModel, getRunById } from '@itzam/server/db/run/actions';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
export function RunDetails({
  runId,
}: {
  runId: string | null;
}) {
  const [run, setRun] = useState<RunWithModel | null>(null);

  useEffect(() => {
    const fetchRun = async () => {
      const run = await getRunById(runId ?? '');
      setRun(run ?? null);
    };
    if (runId) {
      fetchRun();
    }
  }, [runId]);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0, scale: 0.99 }}
      animate={{ height: 'auto', opacity: 1, scale: 1 }}
      exit={{ height: 0, opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {run && (
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h4 className="text-muted-foreground text-sm">Duration</h4>
              <div className="mt-1">
                <p className="text-sm">{run?.durationInMs + 'ms'}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-muted-foreground text-sm">Cost</h4>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-sm">{`$${run?.cost}`}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h4 className="text-muted-foreground text-sm">Input Tokens</h4>
              <p className="mt-1 text-sm">{run?.inputTokens}</p>
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-muted-foreground text-sm">Output Tokens</h4>
              <p className="mt-1 text-sm">{run?.outputTokens}</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
