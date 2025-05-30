import { env } from "@itzam/utils/env";
import { logger } from "@trigger.dev/sdk/v3";
import { Itzam } from "itzam";
import type { Resource } from "./create-resource";

export const getTextFromResource = async (
  resource: Resource
): Promise<{ text: string; fileSize: number }> => {
  return logger.trace("convert-single-file", async (span) => {
    const start = Date.now();
    try {
      const file = await fetchFile(resource);

      const tikaUrl = env.TIKA_URL || "http://localhost:9998/tika";
      const res = await fetch(tikaUrl, {
        method: "PUT",
        headers: {
          Accept: "text/plain",
        },
        body: file,
      });

      if (!res.ok) {
        throw new Error(`Failed to convert file: ${res.statusText}`);
      }

      const fileName =
        resource.type === "FILE" ? resource.fileName : resource.url;
      const text = await res.text();
      const end = Date.now();
      logger.log("Tika conversion completed", {
        fileName,
        durationMs: end - start,
        fileSize: file.size,
        textLength: text.length,
      });
      span.setAttribute("fileName", fileName);
      span.setAttribute("durationMs", end - start);
      span.setAttribute("fileSize", file.size);
      span.setAttribute("textLength", text.length);
      return { text, fileSize: file.size };
    } catch (err) {
      const end = Date.now();
      logger.error("Error processing file:", {
        error: err,
        durationMs: end - start,
      });
      span.setAttribute("error", String(err));
      span.setAttribute("durationMs", end - start);
      return { text: "", fileSize: 0 }; // Return empty string for failed conversions
    }
  });
};

const fetchFile = async (resource: Resource): Promise<File> => {
  return logger.trace("fetch-file", async (span) => {
    span.setAttribute("url", resource.url);

    if (resource.type === "FILE") {
      span.setAttribute("filename", resource.fileName);
      span.setAttribute("mimeType", resource.mimeType);
    } else {
      span.setAttribute("filename", resource.url);
      span.setAttribute("mimeType", "application/octet-stream");
    }

    if (isUrlFile(resource.url)) {
      const file = await fetch(resource.url);

      if (!file.ok) {
        throw new Error(`Could not fetch file: ${file.statusText}`);
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      const type =
        resource.type === "FILE"
          ? resource.mimeType
          : file.headers.get("content-type");

      if (!type) {
        throw new Error("Could not determine mime type");
      }

      return new File(
        [buffer],
        resource.type === "FILE" ? resource.fileName : resource.url,
        {
          type,
        }
      );
    }

    throw new Error("Invalid file format");
  });
};

const isUrlFile = (file: string): boolean => {
  return file.startsWith("http://") || file.startsWith("https://");
};

export const generateFileTitleForResource = async (
  text: string,
  resource: Resource
) => {
  return logger.trace("generate-file-title-for-resource", async (span) => {
    let title = "";
    const start = Date.now();
    try {
      title = await generateFileTitle(text, resource.fileName ?? "");
    } catch (error) {
      title = resource.fileName ?? "";
      logger.error("Error generating file title", { error });
      span.setAttribute("error", String(error));
    }

    const end = Date.now();
    logger.log("Resource title updated", {
      resourceId: resource.id,
      title,
      durationMs: end - start,
    });
    span.setAttribute("resourceId", resource.id);
    span.setAttribute("title", title);
    span.setAttribute("durationMs", end - start);

    return title;
  });
};

const itzam = new Itzam(env.ITZAM_API_KEY);

const generateFileTitle = async (
  text: string,
  originalFileName: string
): Promise<string> => {
  // limit text to 1000 characters
  const limitedText = text.slice(0, 1000);
  return logger.trace("generate-file-title", async (span) => {
    const start = Date.now();
    try {
      // For now, use a simple approach - in production you'd want to call your AI service
      // This is a placeholder - you should replace with actual AI call
      const response = await itzam.generateText({
        input: `
          Original file name: ${originalFileName}
          File content: ${limitedText}
          `,
        workflowSlug: "file-title-generator",
      });

      if (response.text) {
        const end = Date.now();
        logger.log("File title generated", {
          originalFileName,
          generatedTitle: response.text || originalFileName,
          durationMs: end - start,
        });
        span.setAttribute("originalFileName", originalFileName);
        span.setAttribute("generatedTitle", response.text || originalFileName);
        span.setAttribute("durationMs", end - start);
        return response.text || originalFileName;
      }

      const end = Date.now();
      logger.log("File title fallback to original", {
        originalFileName,
        durationMs: end - start,
      });
      span.setAttribute("originalFileName", originalFileName);
      span.setAttribute("durationMs", end - start);
      return originalFileName;
    } catch (error) {
      const end = Date.now();
      logger.error("Error generating file title:", {
        error,
        durationMs: end - start,
      });
      span.setAttribute("error", String(error));
      span.setAttribute("durationMs", end - start);
      return originalFileName;
    }
  });
};
