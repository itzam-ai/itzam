import { useEffect } from "react";

export const useKeyboardShortcut = (
  shortcut: string,
  shift: boolean,
  ctrlOrCommand: boolean,
  alt: boolean,
  callback: () => void,
  options?: {
    ignoreInputFocus?: boolean;
  }
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the key combination matches
      const isShortcutMatch = 
        e.key === shortcut &&
        (shift ? e.shiftKey : !e.shiftKey) &&
        (ctrlOrCommand ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey) &&
        (alt ? e.altKey : !e.altKey);
      
      if (!isShortcutMatch) return;

      // Check if user is focused on any input element (unless explicitly ignored)
      if (!options?.ignoreInputFocus) {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT" ||
          (activeElement as HTMLElement).contentEditable === "true"
        );
        
        if (isInputFocused) return;
      }

      e.preventDefault();
      callback();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcut, callback, shift, ctrlOrCommand, alt, options?.ignoreInputFocus]);
};
