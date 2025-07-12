import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Footer } from "~/components/landing/footer";
import { NavBar } from "~/components/landing/navbar";
import { CodeBlockCode } from "~/components/ui/code-block";
import { cn } from "~/lib/utils";
import { getAllPosts, getPostBySlug } from "~/lib/blog";
import React from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post not found",
    };
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-between bg-background px-6 xl:px-0">
      <NavBar />

      <main className="flex-1">
        <article className="mx-auto max-w-3xl pb-32 pt-48">
          <header className="mb-8">
            <h1 className="text-5xl font-serif tracking-tight mb-4 lg:text-6xl">
              {post.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {post.description}
            </p>

            <div className="flex items-center gap-4 mb-6">
              {post.authors.map((author, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="relative size-6 rounded-full overflow-hidden">
                    <Image
                      src={author.image}
                      alt={author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{author.name}</div>
                  </div>
                </div>
              ))}
              <time className="text-sm text-muted-foreground">
                {format(new Date(post.date), "MMMM dd, yyyy")}
              </time>
            </div>
          </header>

          <div className="prose prose-neutral max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ className, ...props }) => (
                  <h1
                    className={cn(
                      "scroll-m-20 text-4xl font-medium tracking-tight lg:text-5xl",
                      className,
                    )}
                    {...props}
                  />
                ),
                h2: ({ className, ...props }) => (
                  <h2
                    className={cn(
                      "scroll-m-20 text-2xl font-medium tracking-tight first:mt-0",
                      className,
                    )}
                    {...props}
                  />
                ),
                h3: ({ className, ...props }) => (
                  <h3
                    className={cn(
                      "scroll-m-20 text-lg font-medium tracking-tight",
                      className,
                    )}
                    {...props}
                  />
                ),
                h4: ({ className, ...props }) => (
                  <h4
                    className={cn(
                      "scroll-m-20 text-base font-medium tracking-tight",
                      className,
                    )}
                    {...props}
                  />
                ),
                p: ({ className, ...props }) => (
                  <p
                    className={cn(
                      "leading-7 [&:not(:first-child)]:mt-4 text-neutral-800 dark:text-neutral-400",
                      className,
                    )}
                    {...props}
                  />
                ),
                a: ({ className, href, children }) => (
                  <Link
                    href={href || ""}
                    target="_blank"
                    className={cn(
                      "group cursor-pointer underline decoration-neutral-400 decoration-1 underline-offset-2 transition-all duration-200 ease-in-out hover:decoration-neutral-500",
                      className,
                    )}
                  >
                    {children}

                    <ArrowUpRight className="ml-0.5 inline-block h-2.5 w-2.5 text-neutral-400 transition-all duration-200 ease-in-out group-hover:-translate-y-[1px] group-hover:translate-x-[1px] group-hover:text-neutral-500" />
                  </Link>
                ),
                strong: ({ className, ...props }) => (
                  <strong className={cn("font-medium", className)} {...props} />
                ),
                ul: ({ className, ...props }) => (
                  <ul
                    className={cn(
                      "my-0 ml-4 list-disc text-neutral-800 dark:text-neutral-400 marker:text-neutral-600",
                      className,
                    )}
                    {...props}
                  />
                ),
                ol: ({ className, ...props }) => (
                  <ol
                    className={cn(
                      "my-0 ml-4 list-decimal text-neutral-800 dark:text-neutral-400 marker:text-neutral-400",
                      className,
                    )}
                    {...props}
                  />
                ),
                li: ({ className, ...props }) => (
                  <li
                    className={cn(
                      "mt-0 text-neutral-800 dark:text-neutral-400",
                      className,
                    )}
                    {...props}
                  />
                ),
                blockquote: ({ className, ...props }) => (
                  <blockquote
                    className={cn(
                      "mt-6 border-l-2 border-slate-300 pl-6 italic text-slate-800 [&>*]:text-slate-600",
                      className,
                    )}
                    {...props}
                  />
                ),
                img: ({ className, alt, src, width, height, ...props }) => (
                  <Image
                    className={cn("rounded-md border", className)}
                    alt={alt || "Image"}
                    src={src || ""}
                    width={width ? Number(width) : undefined}
                    height={height ? Number(height) : undefined}
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
                      className,
                    )}
                    {...props}
                  />
                ),
                th: ({ className, ...props }) => (
                  <th
                    className={cn(
                      "border border-slate-200 px-4 py-2 text-left font-medium [&[align=center]]:text-center [&[align=right]]:text-right",
                      className,
                    )}
                    {...props}
                  />
                ),
                td: ({ className, ...props }) => (
                  <td
                    className={cn(
                      "border border-slate-200 px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
                      className,
                    )}
                    {...props}
                  />
                ),
                pre: ({ className, children }) => {
                  // Extract code content and language from children
                  const codeElement = React.Children.only(
                    children,
                  ) as React.ReactElement<{
                    children?: string;
                    className?: string;
                  }>;
                  const code = codeElement?.props?.children || "";
                  const codeClassName = codeElement?.props?.className || "";
                  const language =
                    codeClassName.replace(/language-/, "") || "text";

                  return (
                    <CodeBlockCode
                      code={code}
                      language={language}
                      className={cn("rounded-lg border my-0", className)}
                    />
                  );
                },
                code: ({ className, children }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const language = match ? match[1] : "text";

                  return (
                    <CodeBlockCode
                      code={String(children).replace(/\n$/, "")}
                      language={language}
                      className="rounded-lg border my-0"
                    />
                  );
                },
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
