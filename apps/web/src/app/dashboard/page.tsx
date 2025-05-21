import { redirect } from "next/navigation";
import "server-only";

export default async function DashboardPage() {
  redirect("/dashboard/workflows");
}
