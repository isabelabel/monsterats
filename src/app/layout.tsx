import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LogIn, Sparkles, UserRound, UserPlus } from "lucide-react";
import Link from "next/link";
import "./globals.css";
import { AppSerwistProvider } from "@/components/serwist-provider";
import { getSession } from "@/lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Monsterats",
    template: "%s · Monsterats",
  },
  description: "Fitness challenges with configurable scoring",
  applicationName: "Monsterats",
  appleWebApp: {
    capable: true,
    title: "Monsterats",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#8a05be",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full">
        <AppSerwistProvider>
          <header className="border-border/70 bg-card/85 sticky top-0 z-30 border-b px-4 py-3.5 shadow-sm shadow-zinc-900/5 backdrop-blur-md">
            <div className="mx-auto flex max-w-3xl items-center justify-between">
              <Link
                href="/"
                className="text-accent text-lg font-semibold tracking-tight"
              >
                Monsterats
              </Link>
              <nav className="flex items-center gap-1 sm:gap-3 text-sm font-medium">
                {session ? (
                  <>
                    <Link
                      href="/challenges/new"
                      className="text-muted hover:text-accent flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors sm:px-1"
                    >
                      <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span className="hidden sm:inline">New challenge</span>
                    </Link>
                    <Link
                      href="/profile"
                      className="text-muted hover:text-accent flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors sm:px-1"
                    >
                      <UserRound className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span className="hidden sm:inline">Profile</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-muted hover:text-accent flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors sm:px-1"
                    >
                      <LogIn className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span className="hidden sm:inline">Sign in</span>
                    </Link>
                    <Link
                      href="/register"
                      className="ui-btn-primary inline-flex items-center gap-1.5 !px-3 !py-2 text-sm shadow-md sm:!px-4"
                    >
                      <UserPlus className="h-4 w-4 shrink-0" strokeWidth={2} />
                      Register
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </header>
          <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
        </AppSerwistProvider>
      </body>
    </html>
  );
}
