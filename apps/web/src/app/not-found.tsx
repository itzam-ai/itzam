"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-neutral-950">
      <div className="container flex max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text font-extrabold text-9xl text-transparent">
          404
        </h1>

        <h2 className="mt-4 font-bold text-2xl tracking-tight">
          Page not found
        </h2>

        <p className="mt-4 text-muted-foreground">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It
          might have been moved or deleted.
        </p>

        <div className="mt-8">
          <Button
            className="gap-2"
            variant="primary"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
