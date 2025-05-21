import { generateBootstrapValues } from "@itzam/server/statsig/index";
import { env } from "@itzam/utils/env";
import { Provider as JotaiProvider } from "jotai";
import type { Metadata } from "next";
import { Figtree as FontSans } from "next/font/google";
import { cookies } from "next/headers";
import { ClientProviders } from "~/app/client-providers";
import { cn } from "~/lib/utils";
import "../styles/globals.css";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { getUser } from "@itzam/server/db/auth/actions";

export const metadata: Metadata = {
  title: "Itzam",
  description: "npm i itzam",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Itzam",
    description: "npm i itzam",
    siteName: "Itzam",
    locale: "en_US",
    type: "website",
    url: "https://itz.am",
  },
  twitter: {
    card: "summary_large_image",
    title: "Itzam",
    description: "npm i itzam",
  },
};

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = await getUser();
  const values = await generateBootstrapValues({ userId: data?.user?.id });

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(fontSans.variable)}
        style={{
          scrollBehavior: "smooth",
        }}
      >
        <JotaiProvider>
          <ClientProviders values={values}>{children}</ClientProviders>
        </JotaiProvider>
        {env.NODE_ENV === "development" && <BikeSheddingDisclaimer />}
      </body>
    </html>
  );
}

const BikeSheddingDisclaimer = async () => {
  const cookieStore = await cookies();
  const position = cookieStore.get("bike-shedding-disclaimer-position");
  const tiredOfThis = cookieStore.get("bike-shedding-disclaimer-tired");

  async function toggle() {
    "use server";
    const cookieStore = await cookies();
    const position = cookieStore.get("bike-shedding-disclaimer-position");

    if (position?.value === "bottom") {
      cookieStore.set("bike-shedding-disclaimer-position", "top");
    } else {
      cookieStore.set("bike-shedding-disclaimer-position", "bottom");
    }
  }

  async function toggleTired() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.set("bike-shedding-disclaimer-tired", "true");
  }

  if (tiredOfThis?.value === "true") {
    return null;
  }

  return (
    <div
      className={cn(
        "text-black absolute transition-all duration-300 right-4 bg-yellow-500  rounded-lg p-4",
        position?.value === "bottom" ? "bottom-4" : "top-4"
      )}
    >
      <p>10x better DX</p>
      <p>we are dead by default</p>
      <div className="flex justify-between mt-4">
        <button
          className="hover:opacity-80 transition-opacity duration-300"
          onClick={toggle}
        >
          {position?.value === "bottom" ? <ArrowUp /> : <ArrowDown />}
        </button>
        <button
          className="hover:opacity-80 transition-opacity duration-300"
          onClick={toggleTired}
        >
          <X />
        </button>
      </div>
    </div>
  );
};
