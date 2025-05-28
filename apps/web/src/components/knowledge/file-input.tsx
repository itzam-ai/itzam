"use client";

import { Chunk } from "@itzam/server/ai/embeddings";
import { checkPlanLimits, Knowledge } from "@itzam/server/db/knowledge/actions";
import { subscribeToChannel, supabase } from "@itzam/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, FileIcon, FileUpIcon, PlusIcon, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { v7 } from "uuid";
import { useCurrentUser } from "~/hooks/useCurrentUser";

import { chunkAndEmbed } from "~/components/knowledge/actions";
import EmptyStateDetails from "../empty-state/empty-state-detais";
import { Button } from "../ui/button";
import { FileUpload, FileUploadContent } from "../ui/file-upload";
import { KnowledgeItem } from "./knowledge-item";
interface ExtendedFile extends File {
  id: string;
  url: string | null;
}

const uploadFileToSupabase = async (
  file: File,
  userId: string
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
  knowledge,
}: {
  workflowId: string;
  knowledge: Knowledge;
}) => {
  const [workflowFiles, setWorkflowFiles] = useState<Knowledge["resources"]>(
    knowledge?.resources.filter((resource) => resource.type === "FILE") ?? []
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

    setFiles((prevFiles) => [...prevFiles, ...filesWithIds]);

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
        })
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

    setWorkflowFiles((prevFiles) => {
      return prevFiles.concat(
        files.map((file) => ({
          id: file.id,
          status: "PENDING",
          title: file.name,
          createdAt: new Date(),
          updatedAt: new Date(),
          url: file.url ?? "",
          fileName: file.name,
          mimeType: file.type,
          type: "FILE",
          fileSize: file.size,
          knowledgeId: knowledge?.id ?? "",
          workflowId,
          active: true,
          chunks: [],
        }))
      );
    });

    // server action to check plan's limits
    try {
      await checkPlanLimits(
        files.map((file) => ({
          fileName: file.name,
          url: file.url ?? "",
          mimeType: file.type,
        })),
        knowledge?.id ?? ""
      );

      await chunkAndEmbed({
        resources: files.map((file) => ({
          fileName: file.name,
          url: file.url ?? "",
          mimeType: file.type,
          type: "FILE",
          fileSize: file.size,
          id: file.id,
        })),
        knowledgeId: knowledge?.id ?? "",
        workflowId: workflowId,
      });
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message);
    }

    setFiles([]);
    setIsSubmitting(false);
  };

  const handleDelete = (resourceId: string) => {
    setWorkflowFiles((prevFiles) =>
      prevFiles.filter((file) => file.id !== resourceId)
    );
  };

  const channelId = `knowledge-${knowledge?.id}-files`;

  useEffect(() => {
    const unsubscribe = subscribeToChannel(
      channelId,
      (payload: {
        status: "FAILED" | "PENDING" | "PROCESSED";
        resourceId: string;
        title: string;
        chunks: Chunk[];
        fileSize: number;
      }) => {
        setWorkflowFiles((files) => {
          return files.map((file) => {
            if (file.id === payload.resourceId) {
              return {
                ...file,
                status: payload.status,
                title: payload.title,
                chunks: payload.chunks,
                fileSize: payload.fileSize,
              };
            }
            return file;
          });
        });
      }
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
                  {files.map((file) => (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      key={file.id}
                      className={`flex gap-2 items-center bg-muted-foreground/20 rounded-sm px-2 py-1.5 border border-muted-foreground/10 ${
                        file.url ? "opacity-100" : "opacity-50"
                      }`}
                    >
                      <FileUpIcon className="size-3" />
                      <p className="text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-32">
                        {file.name}
                      </p>
                      <X
                        className="size-3 hover:opacity-70 transition-opacity cursor-pointer text-red-500"
                        onClick={() =>
                          setFiles((prevFiles) =>
                            prevFiles.filter((f) => f.id !== file.id)
                          )
                        }
                      />
                    </motion.div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isUploading || isSubmitting || files.length === 0}
                >
                  <ArrowDown className="size-3" />
                  Add to knowledge
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {workflowFiles && workflowFiles.length > 0 ? (
          <motion.div className="flex flex-col gap-2 mt-2 rounded-lg border border-border shadow-sm bg-muted-foreground/5 p-2">
            {workflowFiles.map((resource) => (
              <KnowledgeItem
                key={resource.id}
                resource={resource}
                onDelete={handleDelete}
              />
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-16 rounded-lg border border-dashed border-border mt-2">
            <EmptyStateDetails
              title="No files added"
              description="Drop files to the model's knowledge base"
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
              Release to add files to your knowledge base
            </p>
          </div>
        </div>
      </FileUploadContent>
    </FileUpload>
  );
};
