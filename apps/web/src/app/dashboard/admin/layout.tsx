import { redirect } from "next/navigation";
import { getUser } from "@itzam/server/db/auth/actions";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, error } = await getUser();

  if (error || !data.user) {
    redirect("/");
  }

  if (
    data.user.user_metadata.role !== "ADMIN" &&
    process.env.NODE_ENV !== "development"
  ) {
    redirect("/");
  }

  return <div>{children}</div>;
}
