"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createContext } from "@itzam/server/db/contexts/actions";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Spinner } from "../ui/spinner";
import { Textarea } from "../ui/textarea";
import { generateSlug } from "../workflows/create-workflow-dialog";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  slug: z.string().min(1, "Slug is required"),
});

export const CreateContextButton = ({ workflowId }: { workflowId: string }) => {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
    },
    mode: "onChange",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const context = await createContext(
        workflowId,
        values.name,
        values.slug,
        values.description
      );

      if (context && "error" in context) {
        throw new Error("Failed to create context");
      }

      toast.success("Context created");
      setIsDialogOpen(false);
      form.reset();
      router.push(
        `/dashboard/workflows/${workflowId}/knowledge/contexts/${context?.id}`
      );
    } catch (error) {
      toast.error("Failed to create context");
      console.error(error);
    }
  }

  useEffect(() => {
    const name = form.watch("name");
    if (name) {
      const generatedSlug = generateSlug(name);
      form.setValue("slug", generatedSlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("name")]);
  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          form.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <PlusIcon className="size-3" />
          Add context
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Context</DialogTitle>
          <DialogDescription>Create your first context.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 outline-none"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Special Documents" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="special-documents"
                      onChange={(e) => {
                        // Allow manual edits to the slug
                        const value = e.target.value;
                        const cleanedValue = generateSlug(value);
                        form.setValue("slug", cleanedValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description
                    <span className="ml-1.5 text-muted-foreground text-xs">
                      Optional
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Documents only admins can ask about"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            disabled={form.formState.isSubmitting}
            onClick={() => {
              setIsDialogOpen(false);
              form.reset();
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="w-20"
            disabled={
              !form.formState.isValid ||
              !form.formState.isDirty ||
              form.formState.isSubmitting
            }
            onClick={form.handleSubmit(onSubmit)}
          >
            {form.formState.isSubmitting ? <Spinner /> : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
