"use client";

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { useCurrentUser } from "~/hooks/useCurrentUser";

export default function Login() {
  const { isSignedIn } = useCurrentUser();

  if (isSignedIn) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center w-full max-w-sm px-4">
        <Image
          src="/logo.svg"
          alt="Itzam Logo"
          width={48}
          height={48}
          className="size-6"
          priority
        />
        <h1 className="text-2xl font-semibold tracking-tight mt-4">
          Itzam Chat
        </h1>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Chat with your favorite AI models.
          <br />
          Totally integrated with Itzam.
        </p>

        <div className="flex items-center justify-center gap-x-2 mt-8">
          <Button asChild variant="outline">
            <Link href="https://itz.am/auth/sign-up">Sign up</Link>
          </Button>
          <Button asChild variant="primary">
            <Link href="https://itz.am/auth/login">Log in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
