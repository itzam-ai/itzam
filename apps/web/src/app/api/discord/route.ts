import { env } from "@itzam/utils/env";

// Validate webhook signature from Vercel
function validateSignature(signature: string | null): boolean {
  if (!signature) {
    return false;
  }

  return signature === env.VERCEL_WEBHOOK_SECRET;
}

interface ErrorNotification {
  type: "error";
  error: {
    name: string;
    message: string;
    stack?: string;
    code?: number;
  };
  context?: {
    userId?: string;
    workflowSlug?: string;
    endpoint?: string;
    timestamp: string;
    environment?: string;
  };
}

function formatErrorForDiscord(errorData: ErrorNotification) {
  const { error, context } = errorData;
  const emoji = getErrorEmoji(error.code);

  // Discord only accepts content without embeds for simple webhooks
  // Format error as rich text content instead of embeds
  const timestamp = context?.timestamp || new Date().toISOString();

  let content = `${emoji} **API Error Alert** - ${context?.environment || "Production"} <@129021923945480192> <@281105209093259275>\n\n`;
  content += `**Error:** ${error.name}: ${error.message.slice(0, 200)}${error.message.length > 200 ? "..." : ""}\n`;
  content += `**Time:** ${timestamp}\n`;

  if (error.code) {
    content += `**Status Code:** ${error.code}\n`;
  }

  if (context?.endpoint) {
    content += `**Endpoint:** ${context.endpoint}\n`;
  }

  if (context?.workflowSlug) {
    content += `**Workflow:** ${context.workflowSlug}\n`;
  }

  if (context?.userId) {
    content += `**User ID:** ${context.userId}\n`;
  }

  // Calculate remaining space for stack trace (Discord limit is 2000 chars)
  const currentLength = content.length;
  const remainingSpace = 1900 - currentLength; // Leave some buffer

  if (error.stack && remainingSpace > 100) {
    const stackTrace = error.stack.slice(0, remainingSpace - 20);
    content += `\n**Stack Trace:**\n\`\`\`\n${stackTrace}${error.stack.length > remainingSpace - 20 ? "..." : ""}\n\`\`\``;
  }

  // Final safety check - ensure content is under 2000 chars
  if (content.length > 2000) {
    content = content.slice(0, 1997) + "...";
  }

  return {
    content,
  };
}

function getErrorEmoji(code?: number): string {
  if (!code) return "❌";
  switch (Math.floor(code / 100)) {
    case 4:
      return "⚠️";
    case 5:
      return "🚨";
    default:
      return "❌";
  }
}

export async function POST(req: Request) {
  const DISCORD_WEBHOOK_URL = env.DISCORD_WEBHOOK_URL;

  if (!DISCORD_WEBHOOK_URL) {
    console.log("Discord webhook URL is not set");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get raw body for signature validation
    const rawBody = await req.text();
    const signature = req.headers.get("x-vercel-signature");

    // For Vercel webhooks, validate signature
    if (signature) {
      if (!validateSignature(signature)) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Parse webhook payload
      const webhookData = JSON.parse(rawBody);
      let content = "";

      // Handle different webhook events
      switch (webhookData.type) {
        case "deployment.succeeded":
          content = `🚀 Deployment succeeded for ${webhookData.payload.deployment.url} by ${webhookData.payload.user.id}`;
          break;
        case "deployment.error":
          content = `❌ Deployment failed for ${webhookData.payload.deployment.url} by ${webhookData.payload.user.id}`;
          break;
      }

      if (content === "") {
        return;
      }

      // Send to Discord
      const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!discordResponse.ok) {
        throw new Error("Failed to send Discord message");
      }
    } else {
      // Parse the body to check message type
      const body = JSON.parse(rawBody);

      if (body.type === "error") {
        // Handle error notifications with rich formatting
        const errorData = body as ErrorNotification;
        const discordMessage = formatErrorForDiscord(errorData);

        const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(discordMessage),
        });

        if (!discordResponse.ok) {
          const errorText = await discordResponse.text();
          throw new Error(`Failed to send Discord message: ${errorText}`);
        }
      } else {
        // Forward the entire payload to Discord webhook
        const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!discordResponse.ok) {
          const errorText = await discordResponse.text();
          throw new Error(`Failed to send Discord message: ${errorText}`);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Failed to send message" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
