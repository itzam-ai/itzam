import { Provider as JotaiProvider } from "jotai";
import type { Metadata } from "next";
import { Figtree as FontSans } from "next/font/google";
import { ClientProviders } from "~/app/client-providers";
import { cn } from "~/lib/utils";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Itzam Chat",
  description: "Chat with every AI model",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Itzam Chat",
    description: "Chat with every AI model",
    siteName: "Itzam Chat",
    locale: "en_US",
    type: "website",
    url: "https://chat.itz.am",
  },
  twitter: {
    card: "summary_large_image",
    title: "Itzam Chat",
    description: "Chat with every AI model",
  },
};

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(fontSans.variable)}
        style={{
          scrollBehavior: "smooth",
        }}
      >
        <JotaiProvider>
          <ClientProviders>{children}</ClientProviders>
        </JotaiProvider>
      </body>
    </html>
  );
}
