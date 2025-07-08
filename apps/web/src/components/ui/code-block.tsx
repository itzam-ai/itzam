"use client";

import { cn } from "~/lib/utils";
import React, { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { useTheme } from "next-themes";

export type CodeBlockProps = {
  children?: React.ReactNode;
  className?: string;
} & React.HTMLProps<HTMLDivElement>;

export type CodeBlockCodeProps = {
  code: string;
  language?: string;
  theme?: string;
  className?: string;
} & React.HTMLProps<HTMLDivElement>;

export function CodeBlockCode({
  code,
  language = "typescript",
  className,
  ...props
}: CodeBlockCodeProps) {
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

  const classNames = cn(
    "w-full md:text-[13px] text-[12px] [&>pre]:px-4 [&>pre]:py-4 [&>pre]:bg-transparent [&>pre]:my-0 md:overflow-hidden overflow-x-auto",
    className
  );

  // SSR fallback: render plain code if not hydrated yet
  return highlightedHtml ? (
    <div
      className={classNames}
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      {...props}
    />
  ) : (
    <div className={classNames} {...props}>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
