import { env } from "@itzam/utils/env";

// Validate webhook signature from Vercel
function validateSignature(signature: string | null): boolean {
  if (!signature) {
    return false;
  }

  return signature === env.VERCEL_WEBHOOK_SECRET;
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
      // Handle regular Discord message with full webhook support
      const body = JSON.parse(rawBody);
      
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
