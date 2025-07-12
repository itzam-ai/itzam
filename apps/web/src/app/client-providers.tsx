"use client";
import {
  LogLevel,
  StatsigProvider,
  useClientBootstrapInit,
} from "@statsig/react-bindings";
import { StatsigSessionReplayPlugin } from "@statsig/session-replay";
import { StatsigAutoCapturePlugin } from "@statsig/web-analytics";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "~/components/ui/sonner";
import { useCurrentUser } from "~/hooks/useCurrentUser";

export function ClientProviders({
  children,
  values,
}: {
  children: React.ReactNode;
  values: string;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <MyStatsig values={values}>
        <NuqsAdapter>
          <Analytics />
          <Toaster />
          {children}
        </NuqsAdapter>
      </MyStatsig>
    </ThemeProvider>
  );
}

export default function MyStatsig({
  children,
  values,
}: {
  values: string;
  children: React.ReactNode;
}) {
  const { user } = useCurrentUser();

  const client = useClientBootstrapInit(
    process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY!,
    { userID: user?.id ?? "unauthenticated", email: user?.email ?? "" },
    values,
    {
      logLevel: LogLevel.Warn,
      plugins: [
        new StatsigAutoCapturePlugin(),
        new StatsigSessionReplayPlugin(),
      ],
    },
  );

  return <StatsigProvider client={client}>{children}</StatsigProvider>;
}
