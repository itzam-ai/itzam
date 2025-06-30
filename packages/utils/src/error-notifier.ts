interface ErrorContext {
  userId?: string;
  workflowSlug?: string;
  runId?: string;
  endpoint?: string;
  streamType?: "text" | "object";
  environment?: string;
  status?: number;
}

interface NotifyErrorOptions {
  skipProductionCheck?: boolean;
}

export async function notifyError(
  error: Error,
  context?: ErrorContext,
  options?: NotifyErrorOptions
): Promise<void> {
  // Skip notifications in non-production unless explicitly overridden
  if (!options?.skipProductionCheck && process.env.NODE_ENV !== "production") {
    return;
  }

  try {
    const errorNotification = {
      type: "error",
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: context?.status || getErrorCode(error),
      },
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        environment:
          context?.environment || process.env.NODE_ENV || "production",
      },
    };

    // Determine the Discord webhook URL based on environment
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const response = await fetch(`${baseUrl}/api/discord`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorNotification),
    });

    if (!response.ok) {
      console.error(
        "Failed to send Discord error notification:",
        response.statusText
      );
    }
  } catch (notificationError) {
    console.error(
      "Error sending Discord error notification:",
      notificationError
    );
  }
}

// Backward compatibility wrapper
export async function notifyDiscordError(
  error: Error,
  status: number,
  context?: ErrorContext
): Promise<void> {
  return notifyError(
    error,
    { ...context, status },
    {
      skipProductionCheck: true,
    }
  );
}

// Streaming-specific wrapper
export async function notifyStreamingError(
  error: Error,
  context?: ErrorContext
): Promise<void> {
  return notifyError(error, context);
}

function getErrorCode(error: Error): number | undefined {
  // Check if error has a status code property
  if ("status" in error && typeof error.status === "number") {
    return error.status;
  }

  // Check if error has a code property
  if ("code" in error && typeof error.code === "number") {
    return error.code;
  }

  // Check for common AI provider error patterns
  if (error.message.includes("rate limit")) {
    return 429;
  }

  if (
    error.message.includes("unauthorized") ||
    error.message.includes("authentication")
  ) {
    return 401;
  }

  if (error.message.includes("not found")) {
    return 404;
  }

  // Default to 500 for unknown errors
  return 500;
}
