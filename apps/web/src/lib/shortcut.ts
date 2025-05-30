import { useEffect } from "react";

export const useKeyboardShortcut = (
  shortcut: string,
  shift: boolean,
  ctrlOrCommand: boolean,
  alt: boolean,
  callback: () => void
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === shortcut &&
        (shift ? e.shiftKey : true) &&
        (ctrlOrCommand ? e.ctrlKey || e.metaKey : true) &&
        (alt ? e.altKey : true)
      ) {
        e.preventDefault();
        callback();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcut, callback, shift, ctrlOrCommand, alt]);
};
