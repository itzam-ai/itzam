"use client";

import { Card } from "~/components/ui/card";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { forgotPassword } from "@itzam/server/db/auth/actions";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);

    const result = await forgotPassword(formData);

    if (result?.success) {
      toast.success("Email sent", {
        description: "Check your email for a reset link",
      });
      setSent(true);
    } else {
      toast.error(result?.error ?? "Failed to send reset email");
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
          Forgot your password?
        </p>
        <form
          className="flex flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSubmit(formData);
          }}
        >
          <Label htmlFor="email" className="text-sm ml-1">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            className="mt-2"
            placeholder="paul@graham.com"
          />
          <div className="flex gap-2 mt-6">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading || sent}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : sent ? (
                <>
                  <Check className="size-4" />
                  Email sent
                </>
              ) : (
                "Send reset email"
              )}
            </Button>
          </div>

          <div className="flex items-center justify-center mt-8 gap-1">
            <p className="text-sm text-muted-foreground">
              Remember your password?
            </p>
            <Link href="/auth/login">
              <p className="text-sm hover:underline">Log in</p>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
