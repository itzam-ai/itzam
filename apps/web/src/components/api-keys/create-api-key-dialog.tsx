"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createApiKey } from "@itzam/server/db/api-keys/actions";
import { motion } from "framer-motion";
import { AlertTriangleIcon, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Spinner } from "../ui/spinner";
import { Textarea } from "../ui/textarea";
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export function CreateApiKeyDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const newKey = await createApiKey(values.name);

      if (!newKey.plainKey) {
        throw new Error("Failed to create API key");
      }

      setCreated(newKey.plainKey);
      toast.success("API key created");

      router.refresh();
    } catch (error) {
      toast.error("Error");
      console.error(error);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setTimeout(() => {
            setCreated(null);
          }, 200);
          form.reset();
        }
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="!focus:outline-none !focus:ring-0 sm:max-w-[600px]"
        style={{ outline: "none" }}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>New API Key</DialogTitle>
          <DialogDescription>
            Create a new key to start using the API and SDKs.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 focus:outline-none focus:ring-0"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter API key name"
                      {...field}
                      disabled={!!created}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {created && (
              <motion.div
                initial={{ opacity: 0, height: 0, filter: "blur(6px)" }}
                animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
                transition={{
                  duration: 0.3,
                  opacity: { delay: 0.2 },
                  filter: { delay: 0.2 },
                }}
              >
                <p className="mb-2 text-muted-foreground text-sm">
                  Your API key is:
                </p>
                <Textarea
                  value={created}
                  readOnly
                  className="rounded-lg"
                  rows={1}
                />
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-3 py-2">
                  <AlertTriangleIcon
                    className="size-3 text-yellow-500"
                    strokeWidth={2.5}
                  />
                  <p className="text-sm text-yellow-500">
                    This key will only be shown once.
                  </p>
                </div>
              </motion.div>
            )}
            <DialogFooter className="pt-4">
              {created ? (
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  className="flex w-32 items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault();
                    navigator.clipboard.writeText(created);
                    toast.success("Copied to clipboard");
                  }}
                >
                  <Copy className="size-3" strokeWidth={2.5} />
                  Copy
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    size="sm"
                    variant="primary"
                    className="flex w-32 items-center justify-center"
                  >
                    {form.formState.isSubmitting ? (
                      <Spinner />
                    ) : (
                      "Create API Key"
                    )}
                  </Button>
                </div>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
