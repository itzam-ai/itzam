'use client';
import { ModelWithProvider } from '@itzam/server/db/model/actions';
import { useTheme } from 'next-themes';
import ModelIcon from 'public/models/svgs/model-icon';

export function ModelDetails({
  model,
  selectedModelId,
  setSelectedModelId,
}: {
  model: ModelWithProvider;
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <div
      key={model.id}
      className={`flex flex-col gap-1 rounded-lg border p-4 ${
        selectedModelId === model.id
          ? `border-orange-600 ${resolvedTheme === 'dark' ? 'bg-orange-950' : 'bg-orange-50'}`
          : 'border-foreground/10 hover:border-foreground/20'
      } cursor-pointer transition-colors`}
      onClick={() => setSelectedModelId(model.id)}
    >
      <div className="flex items-center gap-2">
        <ModelIcon tag={model.tag ?? ''} size="xs" />
        <span className="font-normal text-sm">{model.name}</span>
      </div>

      <span className="mt-2 font-normal text-muted-foreground text-xs">
        Input (1M):{' '}
        <span className="text-foreground">
          ${Number(model.inputPerMillionTokenCost ?? 0).toFixed(2)}
        </span>
      </span>
      <span className="text-muted-foreground text-xs">
        Output (1M):{' '}
        <span className="text-foreground">
          ${Number(model.outputPerMillionTokenCost ?? 0).toFixed(2)}
        </span>
      </span>
    </div>
  );
}
