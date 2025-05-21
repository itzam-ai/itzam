import { runOriginEnum } from '@itzam/server/db/schema';
import { Blocks, CodeIcon } from 'lucide-react';

export type RunOriginType = (typeof runOriginEnum.enumValues)[number];

export type RunOriginConfig = {
  value: RunOriginType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const runOriginMap: Record<RunOriginType, RunOriginConfig> = {
  SDK: {
    value: 'SDK',
    label: 'SDK',
    icon: CodeIcon,
  },
  WEB: {
    value: 'WEB',
    label: 'Playground',
    icon: Blocks,
  },
};

export function getRunOriginConfig(origin: RunOriginType): RunOriginConfig {
  return runOriginMap[origin];
}
