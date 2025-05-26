import { createStripeCustomer } from "@itzam/server/db/billing/actions";
import { createAdminAuthClient } from "@itzam/server/db/supabase/server";
import { createClient } from "@itzam/supabase/server";
import { env } from "@itzam/utils/env";
import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const supabaseAdmin = await createAdminAuthClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = env.NODE_ENV === "development";

      // if is a new oauth user, create a stripe customer
      if (data.user.user_metadata.stripeCustomerId === undefined) {
        const stripeCustomer = await createStripeCustomer(
          data.user.id,
          data.user.user_metadata.name ?? "",
          data.user.email ?? ""
        );

        // update user metadata with stripe customer id
        await supabaseAdmin.updateUserById(data.user.id, {
          user_metadata: { stripeCustomerId: stripeCustomer.id },
        });
      }

      // if user is new, redirect to onboarding
      if (data.user.user_metadata.onboarded === undefined) {
        next = "/onboard";
      }

      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
