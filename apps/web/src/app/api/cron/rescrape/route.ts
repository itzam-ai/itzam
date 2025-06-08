import {
  getResourcesToRescrape,
  rescrapeResources,
} from "@itzam/server/db/resource/actions";
import { sendDiscordNotification } from "@itzam/server/discord/actions";

export async function GET() {
  const resources = await getResourcesToRescrape();

  console.log(
    `🐛 Found ${resources.length} resources to rescrape (not FILE and frequency not NEVER)`
  );

  if (resources.length > 0) {
    void sendDiscordNotification({
      content: `🐛 Found ${resources.length} link resources to rescrape`,
    });
  }

  await rescrapeResources(resources);

  return new Response("Rescraped workflows");
}
