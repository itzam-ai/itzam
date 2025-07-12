"use client";
import { StatsigProvider, useClientAsyncInit } from "@statsig/react-bindings";
import { StatsigSessionReplayPlugin } from "@statsig/session-replay";
import { StatsigAutoCapturePlugin } from "@statsig/web-analytics";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "~/components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { env } from "@itzam/utils/env";
import { useCurrentUser } from "~/hooks/useCurrentUser";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const { user } = useCurrentUser();
  const { client } = useClientAsyncInit(
    env.NEXT_PUBLIC_STATSIG_CLIENT_KEY,
    {
      userID: user?.id,
      email: user?.email,
    },
    {
      plugins: [
        new StatsigAutoCapturePlugin(),
        new StatsigSessionReplayPlugin(),
      ],
      disableLogging: true,
    },
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <StatsigProvider client={client} loadingComponent={<></>}>
        <NuqsAdapter>
          <Analytics />
          <Toaster />
          {children}
        </NuqsAdapter>
      </StatsigProvider>
    </ThemeProvider>
  );
}
