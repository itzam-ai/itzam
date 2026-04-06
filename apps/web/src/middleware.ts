import { updateSession } from "@itzam/supabase/middleware";
import { maintenanceModeEnabled } from "@itzam/utils/maintenance";
import { NextResponse, type NextRequest } from "next/server";

const blockedPaths = ["/dashboard", "/onboard"];

export async function middleware(request: NextRequest) {
  if (
    maintenanceModeEnabled &&
    blockedPaths.some((path) => request.nextUrl.pathname.startsWith(path))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";

    return NextResponse.redirect(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
