"use client";

import {
  BarChart,
  Bot,
  ChartSpline,
  ExternalLink,
  FileText,
  Key,
  Lock,
  Terminal,
  Workflow,
} from "lucide-react";
import type * as React from "react";

import { LastFiveWorkflows } from "@itzam/server/db/workflow/actions";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavUser } from "~/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "~/components/ui/sidebar";

export function AppSidebar({
  user,
  workflows,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  workflows: LastFiveWorkflows;
  user?: { role?: string; name?: string; image?: string; email?: string };
}) {
  const pathname = usePathname();

  if ("error" in workflows) {
    return <div>{workflows.error.error.toString()}</div>;
  }

  return (
    <Sidebar collapsible="offcanvas" variant="inset" {...props}>
      <SidebarHeader>
        <div className="p-2 pb-0">
          <div className="flex items-center gap-2 ">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={16}
              height={16}
              className="size-3"
            />
            <p className={`text-foreground font-medium`}>Itzam</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href={"/dashboard/workflows"} prefetch={true}>
                <SidebarMenuButton
                  tooltip={"Workflows"}
                  isActive={pathname.includes("/workflows")}
                >
                  <Workflow
                    className={`${pathname.includes("/workflows") ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <p>Workflows</p>
                </SidebarMenuButton>
              </Link>
              {workflows.length > 0 && (
                <SidebarMenuSub>
                  {workflows.map((workflow) => (
                    <SidebarMenuSubItem key={workflow.id}>
                      <SidebarMenuSubButton
                        asChild
                        size="sm"
                        isActive={pathname.includes(
                          `/dashboard/workflows/${workflow.id}`
                        )}
                      >
                        <Link
                          href={`/dashboard/workflows/${workflow.id}`}
                          prefetch={true}
                        >
                          <p className="truncate">{workflow.name}</p>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link href={"/dashboard/providers"} prefetch={true}>
                <SidebarMenuButton
                  tooltip={"Providers"}
                  isActive={pathname.includes("/providers")}
                >
                  <Key
                    className={`${pathname.includes("/providers") ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <p>Providers</p>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link href={"/dashboard/api-keys"} prefetch={true}>
                <SidebarMenuButton
                  tooltip={"API Keys"}
                  isActive={pathname.includes("/api-keys")}
                >
                  <Lock
                    className={`${pathname.includes("/api-keys") ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <p>API Keys</p>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link href={"/dashboard/usage"} prefetch={true}>
                <SidebarMenuButton
                  tooltip={"Usage"}
                  isActive={pathname.includes("/usage")}
                >
                  <ChartSpline
                    className={`${pathname.includes("/usage") ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <p>Usage</p>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link
                href={"https://docs.itz.am"}
                prefetch={true}
                target="_blank"
                className="group/docs"
              >
                <SidebarMenuButton tooltip={"Docs"}>
                  <FileText className="text-muted-foreground" />
                  <p>Docs</p>
                  <SidebarMenuBadge className="group-hover/docs:opacity-100 opacity-0">
                    <ExternalLink className="size-3 text-muted-foreground" />
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {(user?.role === "ADMIN" || process.env.NODE_ENV === "development") && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href={"/dashboard/admin/sdk"} prefetch={true}>
                  <SidebarMenuButton
                    tooltip={"Test SDK"}
                    isActive={pathname.includes("/admin/sdk")}
                  >
                    <Terminal
                      className={`${pathname.includes("/admin/sdk") ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <p>Test SDK</p>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href={"/dashboard/admin/models"} prefetch={true}>
                  <SidebarMenuButton
                    tooltip={"Manage Models"}
                    isActive={pathname.includes("/admin/models")}
                  >
                    <Bot
                      className={`${pathname.includes("/admin/models") ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <p>Models</p>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href={"/dashboard/admin/statistics"} prefetch={true}>
                  <SidebarMenuButton
                    tooltip={"Statistics"}
                    isActive={pathname.includes("/admin/statistics")}
                  >
                    <BarChart
                      className={`${pathname.includes("/admin/statistics") ? "text-orange-600" : "text-muted-foreground"}`}
                    />
                    <p>Statistics</p>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          name={user?.name ?? ""}
          avatar={user?.image ?? ""}
          email={user?.email ?? ""}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
