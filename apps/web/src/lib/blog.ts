import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { cache } from "react";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  authors: Array<{
    name: string;
    image: string;
  }>;
  coverImage: string;
  content: string;
}

export interface BlogPostMetadata {
  slug: string;
  title: string;
  description: string;
  date: string;
  authors: Array<{
    name: string;
    image: string;
  }>;
  coverImage: string;
}

const postsDirectory = path.join(process.cwd(), "posts");

export const getAllPosts = cache(async (): Promise<BlogPostMetadata[]> => {
  const fileNames = fs.readdirSync(postsDirectory);
  const posts = await Promise.all(
    fileNames
      .filter((name) => name.endsWith(".mdx"))
      .map(async (name) => {
        const slug = name.replace(/\.mdx$/, "");
        const fullPath = path.join(postsDirectory, name);
        const fileContents = fs.readFileSync(fullPath, "utf8");
        const { data } = matter(fileContents);

        return {
          slug,
          title: data.title,
          description: data.description,
          date: data.date,
          authors: data.authors,
          coverImage: data.coverImage,
        } as BlogPostMetadata;
      }),
  );

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
});

export const getPostBySlug = cache(
  async (slug: string): Promise<BlogPost | null> => {
    try {
      const fullPath = path.join(postsDirectory, `${slug}.mdx`);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title,
        description: data.description,
        date: data.date,
        authors: data.authors,
        coverImage: data.coverImage,
        content,
      } as BlogPost;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
);
