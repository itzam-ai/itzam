import crypto from "crypto";
import { env } from "@itzam/utils/env";

export async function POST(request: Request) {
  const DISCORD_WEBHOOK_URL = env.DISCORD_WEBHOOK_URL;
  const webhookSecret = env.VERCEL_WEBHOOK_SECRET;

  if (typeof webhookSecret != "string") {
    throw new Error("No integration secret found");
  }

  const rawBody = await request.text();
  const rawBodyBuffer = Buffer.from(rawBody, "utf-8");
  const bodySignature = sha1(rawBodyBuffer, webhookSecret);

  if (bodySignature !== request.headers.get("x-vercel-signature")) {
    return Response.json({
      code: "invalid_signature",
      error: "signature didn't match",
    });
  }

  const json = JSON.parse(rawBodyBuffer.toString("utf-8"));
  let content = "";

  switch (json.type) {
    case "deployment.succeeded":
      content = `🚀 Deployment succeeded for ${json.payload.deployment.url}`;
      break;
    case "deployment.error":
      content = `❌ Deployment failed for ${json.payload.deployment.url}`;
      break;
  }

  if (!content) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Send to Discord
  try {
    const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!discordResponse.ok) {
      throw new Error("Failed to send Discord message");
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

function sha1(data: Buffer, secret: string): string {
  return crypto.createHmac("sha1", secret).update(data).digest("hex");
}
