"use client";

import React from "react";
import aiLogos from "./ai-logos";

interface ModelIconProps {
  tag: string;
  size?: "us" | "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const ModelIcon: React.FC<ModelIconProps> = ({
  tag,
  size = "md",
  className = "",
}) => {
  let name = tag.split(":")[0];

  if (name === "anthropic") {
    name = "claude";
  }

  if (name === "google") {
    name = "gemini";
  }

  const LogoComponent = aiLogos[name as keyof typeof aiLogos];

  if (!LogoComponent) return null;

  return LogoComponent(className, size);
};

export default ModelIcon;
