import { getUser } from "@itzam/server/db/auth/actions";
import { CreditCard, User } from "lucide-react";
import { Billing } from "~/components/settings/billing";
import { Profile } from "~/components/settings/profile";

export default async function SettingsPage() {
  const { data, error } = await getUser();

  if (error || !data || !data.user) {
    return <div>{error?.message}</div>;
  }

  return (
    <div className="space-y-16">
      <div className="space-y-1">
        <h1 className="font-semibold text-xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile and billing.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="flex items-center font-medium">
          <User className="mr-2 size-3.5 text-muted-foreground" /> Profile
        </h2>
        <Profile user={data?.user} />
      </div>

      <div className="space-y-4">
        <h2 className="flex items-center font-medium">
          <CreditCard className="mr-2 size-3.5 text-muted-foreground" /> Billing
        </h2>
        <Billing />
      </div>
    </div>
  );
}
