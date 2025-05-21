import { getUser } from "@itzam/server/db/auth/actions";
import { getLastFiveWorkflows } from "@itzam/server/db/workflow/actions";
import { redirect } from "next/navigation";
import "server-only";
import { Feedback } from "~/components/feedback/feedback";
import { AppSidebar } from "~/components/sidebar/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, error } = await getUser();

  if (error || !data.user) {
    redirect("/");
  }

  const workflows = await getLastFiveWorkflows();

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: data.user.user_metadata.name ?? "",
          image: data.user.user_metadata.avatar_url ?? "",
          role: data.user.user_metadata.role ?? "",
          email: data.user.email ?? "",
        }}
        workflows={workflows}
      />
      <SidebarInset>
        <div className="w-full">
          <div className="relative mx-auto w-full max-w-5xl px-4 py-12">
            <div className="absolute top-0 left-0 block md:hidden">
              <SidebarTrigger />
            </div>
            {children}
          </div>

          <div className="fixed bottom-8 right-8">
            <Feedback />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
