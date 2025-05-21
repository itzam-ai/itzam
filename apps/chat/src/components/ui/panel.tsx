import { Card } from "./card";

export const Panel = ({
  title,
  children,
  additionalInfo,
  caption,
}: {
  title: string;
  children: React.ReactNode;
  additionalInfo?: React.ReactNode;
  caption?: React.ReactNode;
}) => {
  return (
    <div className="w-full rounded-xl bg-neutral-300/10 p-0.5 dark:bg-neutral-800/30">
      <div className="flex justify-between items-center py-2 px-3">
        <h3 className="text-xs font-medium">{title}</h3>
        {additionalInfo && additionalInfo}
      </div>

      <Card className="p-2">{children}</Card>
      {caption && <div className="px-3 py-2">{caption}</div>}
    </div>
  );
};
