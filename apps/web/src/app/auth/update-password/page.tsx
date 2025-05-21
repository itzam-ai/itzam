"use client";

import { updatePassword } from "@itzam/server/db/auth/actions";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useCurrentUser } from "~/hooks/useCurrentUser";

export default function UpdatePasswordPage() {
  const [isLoading, setIsLoading] = useState(false);

  const { loading, isSignedIn, error } = useCurrentUser();

  if (!loading && (error || !isSignedIn)) {
    redirect("/");
  }

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);

    const result = await updatePassword(formData);

    if (result?.success) {
      toast.success("Password updated");
      window.location.href = "/dashboard/workflows";
    } else {
      toast.error(result?.error ?? "Failed to update password");
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
          Update your password
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
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            className="mt-2"
            placeholder="********"
          />

          <Label htmlFor="password-confirm" className="text-sm mt-4 ml-1">
            Confirm Password
          </Label>
          <Input
            id="password-confirm"
            name="password-confirm"
            type="password"
            required
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
                  Updating...
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
