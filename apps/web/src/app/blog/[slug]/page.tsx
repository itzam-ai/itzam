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

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

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
        <article className="mx-auto max-w-3xl py-32">
          {post.coverImage && (
            <div className="aspect-video relative overflow-hidden rounded-lg mb-8">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-4 lg:text-5xl">
              {post.title}
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              {post.description}
            </p>

            <div className="flex items-center gap-4 mb-6">
              <time className="text-sm text-muted-foreground">
                {format(new Date(post.date), "MMMM dd, yyyy")}
              </time>
            </div>

            <div className="flex items-center gap-4">
              {post.authors.map((author, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="relative size-10 rounded-full overflow-hidden">
                    <Image
                      src={author.image}
                      alt={author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{author.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </header>

          <div className="prose prose-gray max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
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
