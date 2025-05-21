import { client, type InferRequestType } from "..";
import { createItzamError } from "../errors";

async function getRunById(
  apiKey: string,
  runId: InferRequestType<
    (typeof client.api.v1.runs)[":id"]["$get"]
  >["param"]["id"]
) {
  try {
    const response = await client.api.v1.runs[":id"].$get(
      {
        param: { id: runId },
      },
      {
        headers: {
          "Api-Key": apiKey,
        },
      }
    );

    if (!response.ok) throw createItzamError(response);

    const data = await response.json();

    return data;
  } catch (error) {
    throw createItzamError(error);
  }
}

export { getRunById };
