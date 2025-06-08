import {
  getResourcesToRescrape,
  rescrapeResources,
} from "@itzam/server/db/resource/actions";

export async function GET() {
  const resources = await getResourcesToRescrape();

  console.log(
    `🐛 Found ${resources.length} resources to rescrape (not FILE and frequency not NEVER)`
  );

  await rescrapeResources(resources);

  return new Response("Rescraped workflows");
}
