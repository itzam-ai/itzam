"use client";

import React from "react";
import aiLogos from "./ai-logos";

interface ProviderIconProps {
  id: string;
  size?: "us" | "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const ProviderIcon: React.FC<ProviderIconProps> = ({
  id,
  size = "md",
  className = "",
}) => {
  const LogoComponent = aiLogos[id as keyof typeof aiLogos];

  if (!LogoComponent) return null;

  return LogoComponent(className, size);
};

export default ProviderIcon;
