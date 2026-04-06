const rawMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE;

export const maintenanceModeEnabled =
  rawMaintenanceMode === undefined ? true : rawMaintenanceMode === "true";

export const maintenanceModeLabel = "Maintenance mode";

export const maintenanceModeNotice =
  "New dashboard access and public API calls are temporarily unavailable while Itzam is in maintenance mode.";

export const maintenanceModeApiMessage =
  "Itzam API is temporarily unavailable while maintenance mode is active.";
