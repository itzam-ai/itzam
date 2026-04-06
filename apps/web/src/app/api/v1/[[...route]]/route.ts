import { vercelHonoApp } from "@itzam/hono/server/index";
import {
  maintenanceModeApiMessage,
  maintenanceModeEnabled,
} from "@itzam/utils/maintenance";

export const runtime = "nodejs";

function getMaintenanceResponse() {
  return new Response(
    JSON.stringify({
      error: "Service unavailable",
      message: maintenanceModeApiMessage,
      maintenance: true,
    }),
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
        "Retry-After": "3600",
      },
    },
  );
}

function withMaintenanceMode(handler: typeof vercelHonoApp) {
  return async (...args: Parameters<typeof vercelHonoApp>) => {
    if (maintenanceModeEnabled) {
      return getMaintenanceResponse();
    }

    return handler(...args);
  };
}

export const GET = withMaintenanceMode(vercelHonoApp);
export const POST = withMaintenanceMode(vercelHonoApp);
export const PUT = withMaintenanceMode(vercelHonoApp);
export const PATCH = withMaintenanceMode(vercelHonoApp);
export const DELETE = withMaintenanceMode(vercelHonoApp);
