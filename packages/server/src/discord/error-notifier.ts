interface ErrorContext {
  userId?: string;
  workflowSlug?: string;
  runId?: string;
  endpoint?: string;
  streamType?: "text" | "object";
}

export async function notifyStreamingError(
  error: Error,
  context?: ErrorContext
): Promise<void> {
  // Only send notifications in production
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  try {
    const errorNotification = {
      type: "error",
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: getErrorCode(error),
      },
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "production",
      },
    };

    // Determine the Discord webhook URL based on environment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const response = await fetch(`${baseUrl}/api/discord`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorNotification),
    });

    if (!response.ok) {
      console.error("Failed to send Discord streaming error notification:", response.statusText);
    }
  } catch (notificationError) {
    console.error("Error sending Discord streaming error notification:", notificationError);
  }
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
  
  if (error.message.includes("unauthorized") || error.message.includes("authentication")) {
    return 401;
  }
  
  if (error.message.includes("not found")) {
    return 404;
  }
  
  // Default to 500 for streaming errors
  return 500;
}