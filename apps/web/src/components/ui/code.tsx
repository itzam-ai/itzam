"use client";

import { cn } from "~/lib/utils";
import React, { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { useTheme } from "next-themes";

export type CodeProps = {
  code: string;
  language?: string;
  theme?: string;
  className?: string;
} & React.HTMLProps<HTMLDivElement>;

export function Code({
  code,
  language = "typescript",
  className,
  ...props
}: CodeProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  const { resolvedTheme } = useTheme();

  const theme = resolvedTheme === "dark" ? "vesper" : "github-light";

  useEffect(() => {
    async function highlight() {
      if (!code) {
        setHighlightedHtml("<pre><code></code></pre>");
        return;
      }

      const html = await codeToHtml(code.trim(), {
        lang: language,
        theme,
        transformers: [
          {
            pre(node) {
              // Remove background color from pre tag
              node.properties.style = (
                node.properties.style as string
              )?.replace(/background-color:[^;]+;/, "");
              return node;
            },
          },
        ],
      });
      setHighlightedHtml(html);
    }
    highlight();
  }, [code, language, theme]);

  // SSR fallback: render plain code if not hydrated yet
  return highlightedHtml ? (
    <div
      className={cn(className)}
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      {...props}
    />
  ) : (
    <div className={cn(className)} {...props}>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
