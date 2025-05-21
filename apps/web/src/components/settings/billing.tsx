import {
  customerIsSubscribedToItzamPro,
  getCurrentUserStripeCustomerId,
  getItzamProProduct,
} from "@itzam/server/db/billing/actions";
import { stripe } from "@itzam/server/stripe/stripe";
import { env } from "@itzam/utils/env";
import Link from "next/link";
import { Button } from "../ui/button";
import { Plan } from "./plan";
import { Card } from "../ui/card";
export async function Billing() {
  const { data: stripeCustomerId } = await getCurrentUserStripeCustomerId();

  const { isSubscribed, priceId } = await customerIsSubscribedToItzamPro();

  return (
    <div className="grid grid-cols-1 gap-4 max-w-md">
      <SubscriptionStatus
        stripeCustomerId={stripeCustomerId}
        priceId={priceId}
        isSubscribed={isSubscribed}
      />
      {!isSubscribed && <NoSubscription />}
    </div>
  );
}

async function NoSubscription() {
  const itzamProProduct = await getItzamProProduct();

  if ("error" in itzamProProduct) {
    return <div>{itzamProProduct.error}</div>;
  }

  const prices = await stripe.prices.list({
    product: itzamProProduct.id,
    active: true,
  });

  const pricesData = prices.data.map((price) => ({
    id: price.id,
    lookup_key: price.lookup_key ?? "",
    unit_amount: price.unit_amount ?? 0,
    monthly_amount:
      price.lookup_key === "pro_yearly"
        ? price.unit_amount! / 12
        : price.unit_amount,
  }));

  return (
    <div className="max-w-md">
      <Plan key={itzamProProduct.id} prices={pricesData} />
    </div>
  );
}

async function SubscriptionStatus({
  stripeCustomerId,
  priceId,
  isSubscribed,
}: {
  stripeCustomerId: string | undefined;
  priceId: string | null;
  isSubscribed: boolean;
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
    <Card className="flex flex-col p-6 w-full">
      <p className="text-sm flex items-center gap-2">
        Plan:{" "}
        {isSubscribed ? (
          <span className="text-foreground px-2 font-semibold rounded-md bg-orange-600 py-0.5">
            Pro
          </span>
        ) : (
          <span className="text-foreground px-2 font-semibold rounded-md bg-muted py-0.5">
            Free
          </span>
        )}
      </p>
      {isSubscribed && (
        <p className="text-sm  mt-4">
          Billed:{" "}
          <span className="text-foreground">
            {price?.lookup_key === "pro_monthly" ? "$20/month" : "$192/year"}
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
