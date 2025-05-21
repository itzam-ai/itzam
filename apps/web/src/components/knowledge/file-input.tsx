"use client";

import {
  createResources,
  deleteResource,
  Knowledge,
} from "@itzam/server/db/knowledge/actions";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, FileIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { v4 } from "uuid";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { uploadFileToR2 } from "~/lib/r2-client";
import EmptyStateDetails from "../empty-state/empty-state-detais";
import { Button } from "../ui/button";
import { FileUpload, FileUploadContent } from "../ui/file-upload";
interface ExtendedFile extends File {
  id: string;
  url: string | null;
}

export const FileInput = ({
  workflowId,
  knowledge,
}: {
  workflowId: string;
  knowledge: Knowledge;
}) => {
  const workflowFiles = knowledge?.resources.filter(
    (resource) => resource.type === "FILE"
  );

  const { user } = useCurrentUser();
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<ExtendedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        id: { value: v4(), writable: true },
        url: { value: null, writable: true },
      });

      return extendedFile;
    });

    setFiles((prevFiles) => [...prevFiles, ...filesWithIds]);

    // upload the files to r2
    const uploadedFiles = await Promise.all(
      filesWithIds.map((file) =>
        uploadFileToR2(file, user?.id ?? "").catch((error) => {
          console.error(error);
          toast.error(error.message);
          return {
            ...file,
            id: file.id,
            url: null,
          };
        })
      )
    );

    const filesToRemove = uploadedFiles.filter((file) => file.url === null);

    setFiles((prevFiles) =>
      prevFiles.filter((file) => !filesToRemove.some((f) => f.id === file.id))
    );

    setFiles((prevFiles) =>
      prevFiles.map((file) => {
        const uploadedFile = uploadedFiles.find((f) => f?.id === file.id);
        if (uploadedFile?.url) {
          file.url = uploadedFile.url;
        }
        return file;
      })
    );

    setIsUploading(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await createResources(
      files.map((file) => ({
        fileName: file.name,
        url: file.url ?? "",
        mimeType: file.type,
        type: "FILE",
        fileSize: file.size,
      })),
      knowledge?.id ?? "",
      workflowId
    );

    setFiles([]);

    setIsSubmitting(false);
    toast.success("Files added to knowledge base");
  };

  return (
    <FileUpload onFilesAdded={handleAddFiles}>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium">Files</h2>
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
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

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0, filter: "blur(10px)" }}
              animate={{
                opacity: 1,
                y: 0,
                height: "auto",
                filter: "blur(0px)",
              }}
              exit={{ opacity: 0, y: -10, height: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.3 }}
              className="rounded-lg border border-border flex gap-2 items-center p-2 pl-4 bg-muted/50 shadow-sm"
            >
              <div className="flex gap-3 items-center">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`flex gap-1 items-center text-sm ${
                      file.url ? "opacity-100" : "opacity-50"
                    }`}
                  >
                    <FileIcon className="size-3" />
                    {file.name}
                  </div>
                ))}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleSubmit}
                className="ml-auto"
                disabled={isUploading || isSubmitting}
              >
                <ArrowDown className="size-3" />
                Add to knowledge base
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        {workflowFiles && workflowFiles.length > 0 ? (
          <div className="flex flex-col gap-2 mt-2">
            {workflowFiles.map((resource) => (
              <div key={resource.id} className="flex gap-3 items-center">
                <div className="flex justify-center items-center rounded-md bg-card p-2 border border-border">
                  <FileIcon className="size-3" />
                </div>
                <div className="flex flex-col">
                  <p className="font-medium text-sm">{resource.title}</p>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(resource.createdAt, {
                      addSuffix: true,
                    })}
                  </span>
                  {resource.status === "FAILED" && (
                    <span className="text-red-500 text-xs">Failed</span>
                  )}
                  {resource.status === "PENDING" && (
                    <span className="text-yellow-500 text-xs">Pending</span>
                  )}
                  {resource.status === "PROCESSED" && (
                    <span className="text-green-500 text-xs">Processed</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => deleteResource(resource.id, workflowId)}
                >
                  <TrashIcon className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-16 rounded-lg border border-dashed border-border">
            <EmptyStateDetails
              title="No files added"
              description="Drop files to the model's knowledge base"
              icon={<FileIcon />}
            />
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
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
