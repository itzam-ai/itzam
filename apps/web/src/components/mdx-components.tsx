import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import React from "react";
import { cn } from "~/lib/utils";
import { CodeBlockCode } from "~/components/ui/code-block";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ className, ...props }) => (
      <h1
        className={cn(
          "scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl",
          className
        )}
        {...props}
      />
    ),
    h2: ({ className, ...props }) => (
      <h2
        className={cn(
          "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
          className
        )}
        {...props}
      />
    ),
    h3: ({ className, ...props }) => (
      <h3
        className={cn(
          "scroll-m-20 text-2xl font-semibold tracking-tight",
          className
        )}
        {...props}
      />
    ),
    h4: ({ className, ...props }) => (
      <h4
        className={cn(
          "scroll-m-20 text-xl font-semibold tracking-tight",
          className
        )}
        {...props}
      />
    ),
    p: ({ className, ...props }) => (
      <p
        className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
        {...props}
      />
    ),
    ul: ({ className, ...props }) => (
      <ul
        className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}
        {...props}
      />
    ),
    ol: ({ className, ...props }) => (
      <ol
        className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", className)}
        {...props}
      />
    ),
    li: ({ className, ...props }) => (
      <li className={cn("mt-2", className)} {...props} />
    ),
    blockquote: ({ className, ...props }) => (
      <blockquote
        className={cn(
          "mt-6 border-l-2 border-slate-300 pl-6 italic text-slate-800 [&>*]:text-slate-600",
          className
        )}
        {...props}
      />
    ),
    img: ({ className, alt, ...props }) => (
      <Image
        className={cn("rounded-md border", className)}
        alt={alt}
        {...props}
      />
    ),
    hr: ({ ...props }) => (
      <hr className="my-4 border-slate-200 md:my-8" {...props} />
    ),
    table: ({ className, ...props }) => (
      <div className="my-6 w-full overflow-y-auto">
        <table className={cn("w-full", className)} {...props} />
      </div>
    ),
    tr: ({ className, ...props }) => (
      <tr
        className={cn(
          "m-0 border-t border-slate-300 p-0 even:bg-slate-50",
          className
        )}
        {...props}
      />
    ),
    th: ({ className, ...props }) => (
      <th
        className={cn(
          "border border-slate-200 px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
          className
        )}
        {...props}
      />
    ),
    td: ({ className, ...props }) => (
      <td
        className={cn(
          "border border-slate-200 px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
          className
        )}
        {...props}
      />
    ),
    pre: ({ className, children, ...props }) => {
      // Extract code content and language from children
      const codeElement = React.Children.only(children) as React.ReactElement<{
        children?: string;
        className?: string;
      }>;
      const code = codeElement?.props?.children || "";
      const codeClassName = codeElement?.props?.className || "";
      const language = codeClassName.replace(/language-/, "") || "text";

      return (
        <div className="mb-4 mt-6">
          <CodeBlockCode
            code={code}
            language={language}
            theme="github-dark"
            className={cn("rounded-lg border", className)}
            {...props}
          />
        </div>
      );
    },
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "text";
      const isInline = !match;

      if (isInline) {
        return (
          <code
            className={cn(
              "relative rounded bg-slate-100 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-slate-900",
              className
            )}
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <CodeBlockCode
          code={String(children).replace(/\n$/, "")}
          language={language}
          theme="github-dark"
          className="rounded-lg border"
        />
      );
    },
    ...components,
  };
}
