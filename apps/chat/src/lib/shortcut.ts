import { useEffect } from "react";

export const useKeyboardShortcut = (
  shortcut: string,
  modifiers: boolean,
  callback: () => void
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === shortcut && (modifiers ? e.metaKey && e.shiftKey : true)) {
        e.preventDefault();
        callback();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcut, callback, modifiers]);
};
