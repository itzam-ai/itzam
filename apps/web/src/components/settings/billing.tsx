import {
  getCurrentUserStripeCustomerId,
  getCustomerSubscriptionStatus,
  getItzamBasicProduct,
  getItzamProProduct,
} from "@itzam/server/db/billing/actions";
import { stripe } from "@itzam/server/stripe/stripe";
import { env } from "@itzam/utils/env";
import Link from "next/link";
import { formatStripeValue } from "~/lib/utils";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Plan } from "./plan";
export async function Billing() {
  const { data: stripeCustomerId } = await getCurrentUserStripeCustomerId();

  const { isSubscribed, priceId, plan } = await getCustomerSubscriptionStatus();

  return (
    <div className="grid grid-cols-1 gap-4">
      <SubscriptionStatus
        stripeCustomerId={stripeCustomerId}
        priceId={priceId}
        isSubscribed={isSubscribed}
        plan={plan}
      />
      {!isSubscribed && <NoSubscription />}
    </div>
  );
}

async function NoSubscription() {
  const itzamBasicProduct = await getItzamBasicProduct();
  const itzamProProduct = await getItzamProProduct();

  if ("error" in itzamBasicProduct) {
    return <div>{itzamBasicProduct.error}</div>;
  }

  if ("error" in itzamProProduct) {
    return <div>{itzamProProduct.error}</div>;
  }

  const basicPrices = await stripe.prices.list({
    product: itzamBasicProduct.id,
    active: true,
  });

  const proPrices = await stripe.prices.list({
    product: itzamProProduct.id,
    active: true,
  });

  const basicPricesMapped = basicPrices.data.map((price) => ({
    id: price.id,
    lookup_key: price.lookup_key ?? "",
    unit_amount: price.unit_amount ?? 0,
  }));

  const proPricesMapped = proPrices.data.map((price) => ({
    id: price.id,
    lookup_key: price.lookup_key ?? "",
    unit_amount: price.unit_amount ?? 0,
  }));

  return (
    <div className="flex gap-4">
      <Plan
        product={{
          id: itzamBasicProduct.id,
          name: itzamBasicProduct.name,
        }}
        prices={basicPricesMapped}
      />
      <Plan
        product={{
          id: itzamProProduct.id,
          name: itzamProProduct.name,
        }}
        prices={proPricesMapped}
      />
    </div>
  );
}

async function SubscriptionStatus({
  stripeCustomerId,
  priceId,
  isSubscribed,
  plan,
}: {
  stripeCustomerId: string | undefined;
  priceId: string | null;
  isSubscribed: boolean;
  plan: "hobby" | "basic" | "pro" | null;
}) {
  const price = isSubscribed
    ? await stripe.prices.retrieve(priceId ?? "")
    : null;

  const session = isSubscribed
    ? await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId ?? "",
        return_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
      })
    : null;

  return (
    <Card className="flex flex-col p-6 max-w-md">
      <p className="text-sm flex items-center gap-2">
        Plan:{" "}
        <span className="text-foreground px-2 font-semibold rounded-md bg-orange-600 py-0.5">
          {plan === "pro" ? "Pro" : plan === "basic" ? "Basic" : "Hobby"}
        </span>
      </p>
      {isSubscribed && (
        <p className="text-sm  mt-4">
          Billed:{" "}
          <span className="text-foreground">
            {price?.recurring?.interval === "month"
              ? `$${formatStripeValue(price?.unit_amount ?? 0)}/month`
              : `$${formatStripeValue(price?.unit_amount ?? 0)}/year`}
          </span>
        </p>
      )}
      {isSubscribed && (
        <Link href={session?.url ?? ""}>
          <Button type="submit" variant="outline" className="w-full mt-6">
            Manage Subscription
          </Button>
        </Link>
      )}
    </Card>
  );
}
