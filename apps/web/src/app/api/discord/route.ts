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
  const color = getErrorColor(error.code);
  
  const fields = [
    {
      name: "Error Type",
      value: error.name,
      inline: true,
    },
    {
      name: "Environment",
      value: context?.environment || "unknown",
      inline: true,
    },
  ];

  if (error.code) {
    fields.push({
      name: "Status Code",
      value: error.code.toString(),
      inline: true,
    });
  }

  if (context?.endpoint) {
    fields.push({
      name: "Endpoint",
      value: context.endpoint,
      inline: false,
    });
  }

  if (context?.workflowSlug) {
    fields.push({
      name: "Workflow",
      value: context.workflowSlug,
      inline: true,
    });
  }

  if (context?.userId) {
    fields.push({
      name: "User ID",
      value: context.userId,
      inline: true,
    });
  }

  return {
    content: `${emoji} **API Error Alert** - ${context?.environment || "Production"}`,
    embeds: [
      {
        title: `${error.name}: ${error.message}`,
        description: error.stack ? `\`\`\`\n${error.stack.slice(0, 1000)}${error.stack.length > 1000 ? '...' : ''}\n\`\`\`` : 'No stack trace available',
        color,
        fields,
        timestamp: context?.timestamp || new Date().toISOString(),
      },
    ],
  };
}

function getErrorColor(code?: number): number {
  if (!code) return 0xffff00; // Yellow for unknown
  switch (Math.floor(code / 100)) {
    case 4: return 0xffa500; // Orange for 4xx errors
    case 5: return 0xff0000; // Red for 5xx errors
    default: return 0xffff00; // Yellow for other errors
  }
}

function getErrorEmoji(code?: number): string {
  if (!code) return '❌';
  switch (Math.floor(code / 100)) {
    case 4: return '⚠️';
    case 5: return '🚨';
    default: return '❌';
  }
}

export async function POST(req: Request) {
  const DISCORD_WEBHOOK_URL = env.DISCORD_WEBHOOK_URL;

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
          throw new Error("Failed to send Discord message");
        }
      } else {
        // Handle regular Discord message
        const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: body.content }),
        });

        if (!discordResponse.ok) {
          throw new Error("Failed to send Discord message");
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
