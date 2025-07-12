import HyperDX from "@hyperdx/browser";
import { getUser } from "@itzam/server/db/auth/actions";
import { generateBootstrapValues } from "@itzam/server/statsig/index";
import { env } from "@itzam/utils/env";
import { Provider as JotaiProvider } from "jotai";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import type { Metadata } from "next";
import {
  Figtree as FontSans,
  Instrument_Serif as FontSerif,
} from "next/font/google";
import { cookies } from "next/headers";
import { ClientProviders } from "~/app/client-providers";
import { cn } from "~/lib/utils";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Itzam",
  description: "Open Source Backend for AI",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Itzam",
    description: "Open Source Backend for AI",
    siteName: "Itzam",
    locale: "en_US",
    type: "website",
    url: "https://itz.am",
  },
  twitter: {
    card: "summary_large_image",
    title: "Itzam",
    description: "Open Source Backend for AI",
  },
};

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = FontSerif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

if (env.HYPERDX_API_KEY) {
  HyperDX.init({
    apiKey: env.HYPERDX_API_KEY,
    service: "itzam-nextjs",
    tracePropagationTargets: [env.NEXT_PUBLIC_APP_URL], // Set to link traces from frontend to backend requests
    consoleCapture: true, // Capture console logs (default false)
    advancedNetworkCapture: true, // Capture full HTTP request/response headers and bodies (default false)
    debug: env.NODE_ENV === "development",
  });
}

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
        className={cn(fontSans.variable, fontSerif.variable)}
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

// Move server actions outside the component
async function togglePosition() {
  "use server";
  const cookieStore = await cookies();
  const position = cookieStore.get("bike-shedding-disclaimer-position");

  if (position?.value === "bottom") {
    cookieStore.set("bike-shedding-disclaimer-position", "top");
  } else {
    cookieStore.set("bike-shedding-disclaimer-position", "bottom");
  }
}

async function dismissDisclaimer() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.set("bike-shedding-disclaimer-tired", "true");
}

const BikeSheddingDisclaimer = async () => {
  const cookieStore = await cookies();
  const position = cookieStore.get("bike-shedding-disclaimer-position");
  const tiredOfThis = cookieStore.get("bike-shedding-disclaimer-tired");

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
        <form action={togglePosition}>
          <button
            type="submit"
            className="hover:opacity-80 transition-opacity duration-300"
          >
            {position?.value === "bottom" ? <ArrowUp /> : <ArrowDown />}
          </button>
        </form>
        <form action={dismissDisclaimer}>
          <button
            type="submit"
            className="hover:opacity-80 transition-opacity duration-300"
          >
            <X />
          </button>
        </form>
      </div>
    </div>
  );
};
