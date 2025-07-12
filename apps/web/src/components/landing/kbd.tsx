"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { cn } from "~/lib/utils";

// Map of key codes to display names
const KEY_DISPLAY_NAMES: Record<string, string> = {
  Control: "Ctrl",
  Alt: "Alt",
  Shift: "Shift",
  Meta: "⌘",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Escape: "Esc",
  " ": "Space",
  Enter: "Enter",
  Backspace: "⌫",
  Tab: "Tab",
  Delete: "Del",
  Home: "Home",
  End: "End",
  PageUp: "PgUp",
  PageDown: "PgDn",
  CapsLock: "Caps",
  ContextMenu: "Menu",
  F1: "F1",
  F2: "F2",
  F3: "F3",
  F4: "F4",
  F5: "F5",
  F6: "F6",
  F7: "F7",
  F8: "F8",
  F9: "F9",
  F10: "F10",
  F11: "F11",
  F12: "F12",
};

interface KbdProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  keyCode: string;
  className?: string;
}

export function Kbd({ keyCode, className, ...props }: KbdProps) {
  const [isPressed, setIsPressed] = useState(false);

  // Get display name for the key
  const displayName = KEY_DISPLAY_NAMES[keyCode] || keyCode;

  // Listen for keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle special keys
      if (keyCode === "Control" && (e.ctrlKey || e.key === "Control")) {
        setIsPressed(true);
      }
      // Handle Alt key
      else if (keyCode === "Alt" && (e.altKey || e.key === "Alt")) {
        setIsPressed(true);
      }
      // Handle Shift key
      else if (keyCode === "Shift" && (e.shiftKey || e.key === "Shift")) {
        setIsPressed(true);
      }
      // Handle Space key
      else if (keyCode === " " && e.key === " ") {
        setIsPressed(true);
      }
      // Handle regular keys (case insensitive)
      else if (e.key.toLowerCase() === keyCode.toLowerCase()) {
        setIsPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Handle special keys
      if (keyCode === "Control" && e.key === "Control") {
        setIsPressed(false);
      }
      // Handle Alt key
      else if (keyCode === "Alt" && e.key === "Alt") {
        setIsPressed(false);
      }
      // Handle Shift key
      else if (keyCode === "Shift" && e.key === "Shift") {
        setIsPressed(false);
      }
      // Handle Space key
      else if (keyCode === " " && e.key === " ") {
        setIsPressed(false);
      }
      // Handle regular keys (case insensitive)
      else if (e.key.toLowerCase() === keyCode.toLowerCase()) {
        setIsPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [keyCode]);

  return (
    <kbd
      className={cn(
        "inline-flex min-w-[2rem] items-center justify-center rounded-md px-2 py-1.5 font-medium text-sm hover:cursor-pointer",
        "bg-gradient-to-b from-orange-500 to-orange-600 text-white",
        "border-2 border-t-orange-500 border-r-orange-700 border-b-orange-800 border-l-orange-500",
        "shadow-[0_4px_0_0_rgba(154,52,18,1),0_4px_6px_0_rgba(0,0,0,0.3)]", // orange-900 shadow for deeper 3D effect
        "transition-all duration-75 ease-in-out",
        isPressed &&
          "translate-y-[4px] transform border-orange-700 shadow-none",
        isPressed && "bg-gradient-to-b from-orange-600 to-orange-700",
        className,
      )}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      {...props}
    >
      {displayName}
    </kbd>
  );
}
