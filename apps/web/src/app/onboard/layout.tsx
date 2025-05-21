import { getUser } from "@itzam/server/db/auth/actions";
import { redirect } from "next/navigation";
import "server-only";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, error } = await getUser();

  if (error || !data.user) {
    redirect("/");
  }

  return <>{children}</>;
}
