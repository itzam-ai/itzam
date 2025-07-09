import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { CTA } from "~/components/landing/cta";
import { Footer } from "~/components/landing/footer";
import { NavBar } from "~/components/landing/navbar";
import { getAllPosts, type BlogPostMetadata } from "~/lib/blog";

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-between bg-background px-6 xl:px-0">
      <NavBar />

      <div className="mx-auto flex max-w-4xl pt-32 w-full">
        <Blog posts={posts} />
      </div>

      <section id="cta" className="pt-24 pb-16">
        <CTA />
      </section>

      <Footer />
    </div>
  );
}

interface BlogProps {
  posts: BlogPostMetadata[];
}

function Blog({ posts }: BlogProps) {
  return (
    <section
      id="blog"
      className="flex max-w-4xl flex-col gap-2 pt-12 pb-16 w-full"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex max-w-[calc(100%-150px)] flex-col gap-2">
          <h1 className="font-semibold text-4xl font-serif tracking-wide">
            Blog
          </h1>
          <p className="text-lg text-muted-foreground">
            Learn about the latest updates and features.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        {posts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No blog posts found.</p>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.slug} className="group">
              <Link href={`/blog/${post.slug}`}>
                <div className="overflow-hidden rounded-3xl border bg-card transition-all hover:opacity-80">
                  {post.coverImage && (
                    <div className="aspect-video relative overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-all"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <time className="text-sm text-muted-foreground">
                        {format(new Date(post.date), "MMM dd, yyyy")}
                      </time>
                    </div>
                    <h2 className="text-lg font-medium mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
                      {post.description}
                    </p>
                    <div className="flex items-center gap-2">
                      {post.authors.map((author, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="relative size-4 rounded-full overflow-hidden">
                            <Image
                              src={author.image}
                              alt={author.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {author.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
