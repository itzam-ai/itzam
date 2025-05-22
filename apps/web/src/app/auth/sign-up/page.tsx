"use client";

import { signInWithProvider, signup } from "@itzam/server/db/auth/actions";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import GitHubLogo from "public/github-logo";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignInWithProvider = (provider: "google" | "github") => {
    signInWithProvider(provider);
  };

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    const result = await signup(formData);
    if (result?.success) {
      window.location.href = result.redirectTo ?? "/dashboard/workflows";
    } else {
      toast.error(result?.error ?? "Something went wrong");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Card className="w-full max-w-md px-6 py-8">
        <div className="flex items-center gap-2 w-full justify-center mb-2">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={100}
            height={100}
            className="size-4"
          />
          <p className="text-xl font-medium">Itzam</p>
        </div>
        <p className="text-sm text-muted-foreground mb-8 text-center">
          Sign up to your account
        </p>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex items-center gap-2 w-full"
            disabled={isLoading}
            onClick={() => handleSignInWithProvider("google")}
          >
            <Image src="/google-logo.svg" alt="Google" width={16} height={16} />
            Google
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 w-full"
            disabled={isLoading}
            onClick={() => handleSignInWithProvider("github")}
          >
            <GitHubLogo />
            Github
          </Button>
        </div>
        <div className="flex items-center gap-2 my-4">
          <div className="w-full h-[1px] bg-border" />
          <p className="text-sm text-muted-foreground">or</p>
          <div className="w-full h-[1px] bg-border" />
        </div>
        <form
          className="flex flex-col mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSubmit(formData);
          }}
        >
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="first-name" className="text-sm ml-1">
                First name
              </Label>
              <Input
                id="first-name"
                name="first-name"
                type="text"
                required
                disabled={isLoading}
                placeholder="Paul"
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="last-name" className="text-sm ml-1">
                Last name
              </Label>
              <Input
                id="last-name"
                name="last-name"
                type="text"
                required
                disabled={isLoading}
                placeholder="Graham"
                className="w-full"
              />
            </div>
          </div>
          <Label htmlFor="email" className="text-sm mt-4 ml-1">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            disabled={isLoading}
            className="mt-2"
            placeholder="paul@graham.com"
          />
          <Label htmlFor="password" className="mt-4 text-sm ml-1">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={isLoading}
            className="mt-2"
            placeholder="********"
          />
          <div className="flex gap-2 mt-6">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing up...
                </>
              ) : (
                "Sign up"
              )}
            </Button>
          </div>

          <div className="flex items-center justify-center mt-8 gap-1">
            <p className="text-sm text-muted-foreground">
              Already have an account?
            </p>
            <Link href="/auth/login">
              <p className="text-sm hover:underline">Sign in</p>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
