"use client";

export const Kbd = ({ children }: { children: React.ReactNode }) => {
  return (
    <kbd className="rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium">
      {children}
    </kbd>
  );
};
