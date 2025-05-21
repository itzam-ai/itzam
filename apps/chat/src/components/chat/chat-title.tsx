"use client";

import { TextEffect } from "../ui/text-effect";
export const ChatTitle = ({ title }: { title: string }) => {
  return (
    <TextEffect
      className="font-medium truncate max-w-[240px] text-primary"
      per="char"
      preset="fade"
    >
      {title}
    </TextEffect>
  );
};
