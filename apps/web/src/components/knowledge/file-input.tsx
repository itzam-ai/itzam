"use client";

import { Knowledge } from "@itzam/server/db/knowledge/actions";
import {
  ResourceUpdatePayload,
  subscribeToResourceUpdates,
  supabase,
} from "@itzam/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  FileIcon,
  FileUpIcon,
  Loader2,
  PlusIcon,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { v7 } from "uuid";
import { useCurrentUser } from "~/hooks/useCurrentUser";

import { createResourceAndSendoToAPI } from "@itzam/server/db/resource/actions";
import EmptyStateDetails from "../empty-state/empty-state-detais";
import { Button } from "../ui/button";
import { FileUpload, FileUploadContent } from "../ui/file-upload";
import { Resource } from "../resource/resource";
interface ExtendedFile extends File {
  id: string;
  url: string | null;
}

const uploadFileToSupabase = async (
  file: File,
  userId: string,
): Promise<{ url: string; id: string; createdAt: Date }> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);

  const { data, error } = await supabase.functions.invoke("upload-file", {
    body: formData,
  });

  if (error) {
    throw new Error(error.message || "Failed to upload file");
  }

  if (!data?.imageUrl) {
    throw new Error("No URL returned from upload");
  }

  return {
    url: data.imageUrl,
    id: file.name, // Using filename as ID since the Supabase function doesn't return an ID
    createdAt: new Date(),
  };
};

export const FileInput = ({
  workflowId,
  resources,
  knowledgeId,
  contextId,
  plan,
}: {
  workflowId: string;
  resources: Knowledge["resources"];
  knowledgeId?: string;
  contextId?: string;
  plan: "hobby" | "basic" | "pro" | null;
}) => {
  const [workflowFiles, setWorkflowFiles] = useState<
    (Knowledge["resources"][number] & {
      processedChunks?: number;
    })[]
  >(
    resources
      .filter((resource) => resource.type === "FILE")
      .map((resource) => ({
        ...resource,
        processedChunks: resource.chunks.length ?? 0,
      })) ?? [],
  );

  const { user } = useCurrentUser();
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<ExtendedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const handleAddFiles = async (newFiles: File[]) => {
    setIsUploading(true);

    const filesWithIds = newFiles.map((file) => {
      // Create a new File object with all original properties
      const extendedFile = new File([file], file.name, {
        type: file.type,
        lastModified: file.lastModified,
      }) as ExtendedFile;

      // Add our custom properties while preserving all File properties
      Object.defineProperties(extendedFile, {
        id: { value: v7(), writable: true },
        url: { value: null, writable: true },
      });

      return extendedFile;
    });

    setFiles((prevFiles) => [...filesWithIds, ...prevFiles]);

    startTransition(async () => {
      // upload the files using Supabase function
      const uploadedFiles = await Promise.all(
        filesWithIds.map(async (file) => {
          try {
            const result = await uploadFileToSupabase(file, user?.id ?? "");

            return {
              ...result,
              id: file.id, // Keep the original file ID
            };
          } catch (error) {
            console.error(error);
            toast.error((error as Error).message);
            return {
              id: file.id,
              createdAt: new Date(),
              url: null,
            };
          }
        }),
      );

      const filesToRemove = uploadedFiles.filter((file) => file.url === null);

      setFiles((prevFiles) => {
        return prevFiles
          .filter((file) => !filesToRemove.some((f) => f.id === file.id))
          .map((file) => {
            const uploadedFile = uploadedFiles.find((f) => f?.id === file.id);
            if (uploadedFile?.url) {
              file.url = uploadedFile.url;
            }
            return file;
          });
      });

      setIsUploading(false);
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setFiles([]);

    const resourcesToAdd = files.map((file) => ({
      id: file.id,
      status: "PENDING" as const,
      title: file.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      url: file.url ?? "",
      fileName: file.name,
      mimeType: file.type,
      type: "FILE" as const,
      fileSize: file.size,
      knowledgeId: knowledgeId || null,
      workflowId,
      active: true,
      totalChunks: 0,
      chunks: [],
      scrapeFrequency: "NEVER" as const,
      lastScrapedAt: null,
      totalBatches: 0,
      processedBatches: 0,
      contentHash: null,
      contextId: contextId || null,
    }));

    setWorkflowFiles((prevFiles) => {
      return [...resourcesToAdd, ...prevFiles];
    });

    try {
      await createResourceAndSendoToAPI({
        resources: resourcesToAdd,
        workflowId: workflowId,
        knowledgeId: knowledgeId ?? "",
        contextId: contextId ?? "",
      });
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message);
      // remove the files from the workflow files
      setWorkflowFiles((prevFiles) =>
        prevFiles.filter(
          (file) => !resourcesToAdd.some((f) => f.id === file.id),
        ),
      );
    }

    setFiles([]);
    setIsSubmitting(false);
  };

  const handleDelete = (resourceId: string) => {
    setWorkflowFiles((prevFiles) =>
      prevFiles.filter((file) => file.id !== resourceId),
    );
  };

  const channelId = knowledgeId
    ? `knowledge-${knowledgeId}-files`
    : `context-${contextId}-files`;

  useEffect(() => {
    const unsubscribe = subscribeToResourceUpdates(
      channelId,
      (payload: ResourceUpdatePayload) => {
        setWorkflowFiles((files) => {
          return files.map((file) => {
            if (file.id === payload.resourceId) {
              // Only update fields that are present in the payload (partial updates)
              const updatedFile = { ...file };

              if (
                payload.status !== undefined &&
                payload.status !== "PROCESSED"
              )
                updatedFile.status = payload.status;
              if (payload.title !== undefined)
                updatedFile.title = payload.title;
              if (payload.fileSize !== undefined)
                updatedFile.fileSize = payload.fileSize;
              if (payload.processedChunks !== undefined) {
                updatedFile.processedChunks =
                  (updatedFile.processedChunks ?? 0) + payload.processedChunks;
                if (
                  (updatedFile.processedChunks ?? 0) >=
                  (updatedFile.totalChunks ?? 1)
                )
                  updatedFile.status = "PROCESSED";
              }
              if (
                payload.totalChunks !== undefined &&
                payload.totalChunks !== 0
              )
                updatedFile.totalChunks = payload.totalChunks;

              return updatedFile;
            }
            return file;
          });
        });
      },
    );

    return () => {
      unsubscribe();
    };
  }, [channelId]);

  return (
    <FileUpload onFilesAdded={handleAddFiles}>
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <h2 className="text font-medium ml-0.5">Files</h2>
          {workflowFiles && workflowFiles.length > 0 && (
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => fileInputRef.current?.click()}
              >
                <PlusIcon className="size-3" />
                Add files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={(e) => {
                  if (e.target.files?.length) {
                    handleAddFiles(Array.from(e.target.files!));
                    e.target.value = "";
                  }
                }}
              />
            </div>
          )}
        </div>

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
                marginTop: 0,
                filter: "blur(6px)",
              }}
              animate={{
                opacity: 1,
                height: "auto",
                marginTop: 8,
                filter: "blur(0px)",
                transition: {
                  opacity: { delay: 0.2 },
                  marginTop: { delay: 0.2 },
                  filter: { delay: 0.2 },
                },
              }}
              exit={{
                opacity: 0,
                height: 0,
                marginTop: 0,
                filter: "blur(6px)",
                transition: { height: { delay: 0.2 } },
              }}
              transition={{ duration: 0.3 }}
              className="rounded-lg border border-border shadow-sm bg-muted-foreground/5"
            >
              <div className="flex gap-2 items-center p-2 justify-between">
                <div className="flex gap-2 items-center flex-wrap">
                  {files.map((file) => {
                    const isUploaded = file.url !== null;

                    return (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        key={file.id}
                        className={`flex gap-2 items-center bg-muted-foreground/20 rounded-sm px-2 py-1.5 border border-muted-foreground/10`}
                      >
                        <FileUpIcon
                          className={`size-3 ${isUploaded ? "text-muted-foreground" : "text-muted-foreground/50"}`}
                        />
                        <p
                          className={`text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-32 ${isUploaded ? "text-primary" : "text-muted-foreground"} mr-1`}
                        >
                          {file.name}
                        </p>
                        <AnimatePresence mode="wait" initial={false}>
                          {isUploaded ? (
                            <motion.div
                              key="remove-file"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.15 }}
                            >
                              <X
                                className="size-3 hover:opacity-70 transition-opacity cursor-pointer text-muted-foreground"
                                onClick={() =>
                                  setFiles((prevFiles) =>
                                    prevFiles.filter((f) => f.id !== file.id),
                                  )
                                }
                              />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="uploading-file"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.15 }}
                            >
                              <Loader2 className="size-3 text-yellow-500 animate-spin" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isUploading || isSubmitting || files.length === 0}
                >
                  <ArrowDown className="size-3" />
                  Add to {knowledgeId ? "knowledge" : "context"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {workflowFiles && workflowFiles.length > 0 ? (
          <motion.div className="flex flex-col gap-2 mt-2 rounded-lg border border-border shadow-sm bg-muted-foreground/5 p-2">
            {workflowFiles.map((resource) => (
              <Resource
                key={resource.id}
                resource={resource}
                onDelete={handleDelete}
                plan={plan}
              />
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-12 rounded-lg border border-dashed border-border mt-2">
            <EmptyStateDetails
              title="No files added"
              description={`Drop files to ${
                knowledgeId ? "the model's knowledge base" : "this context"
              }`}
              icon={<FileIcon />}
            />
            <div className="relative">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isSubmitting}
                onClick={() => fileInputRef.current?.click()}
              >
                <PlusIcon className="size-3" />
                Add files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={(e) => {
                  if (e.target.files?.length) {
                    handleAddFiles(Array.from(e.target.files!));
                    e.target.value = "";
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
      <FileUploadContent>
        <div className="flex w-full items-center justify-center backdrop-blur-sm absolute inset-0">
          <div className="bg-background/90 m-4 w-full max-w-md rounded-lg border p-8 shadow-lg">
            <div className="mb-4 flex justify-center">
              <FileIcon />
            </div>
            <h3 className="mb-2 text-center text-base font-medium">
              Drop files to upload
            </h3>
            <p className="text-muted-foreground text-center text-sm">
              Release to add files to your{" "}
              {knowledgeId ? "knowledge base" : "context"}
            </p>
          </div>
        </div>
      </FileUploadContent>
    </FileUpload>
  );
};
