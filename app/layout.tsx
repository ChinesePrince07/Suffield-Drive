import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { AuthProvider } from "@/lib/auth-context";
import { ConfirmProvider } from "@/lib/confirm-context";
import { GlobalDragDropHandler } from "@/components/file-browser/GlobalDragDropHandler";
import { ClipboardProvider } from "@/lib/clipboard-context";

import { Suspense } from 'react';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Suffield Drive",
  description: "Modern cloud storage solution",
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAuthenticated = !!process.env.WEBDAV_URL;

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ConfirmProvider>
            <ClipboardProvider>
              <GlobalDragDropHandler />
              <div className="min-h-[100dvh] bg-background flex flex-col">
                {isAuthenticated ? (
                  <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                    <div className="flex-1 flex flex-col">
                      <Header />
                      <main className="flex-1 p-4 sm:p-6 pb-24">
                        {children}
                      </main>
                      <footer className="py-6 text-center text-sm text-muted-foreground/60">
                        Made by Andy with love
                      </footer>
                    </div>
                  </Suspense>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <main className="flex-1 p-4 sm:p-6">
                      {children}
                    </main>
                    <footer className="py-6 text-center text-sm text-muted-foreground/60">
                      Made by Andy with love
                    </footer>
                  </div>
                )}
              </div>
            </ClipboardProvider>
          </ConfirmProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
