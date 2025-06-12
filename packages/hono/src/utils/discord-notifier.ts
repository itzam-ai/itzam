interface ErrorContext {
  userId?: string;
  workflowSlug?: string;
  endpoint?: string;
  environment?: string;
}

export async function notifyDiscordError(
  error: Error,
  context?: ErrorContext
): Promise<void> {
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/discord`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorNotification),
    });

    if (!response.ok) {
      console.error("Failed to send Discord notification:", response.statusText);
    }
  } catch (notificationError) {
    console.error("Error sending Discord notification:", notificationError);
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
  
  // Default to 500 for unknown errors
  return 500;
}