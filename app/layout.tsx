import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { AuthProvider } from "@/lib/auth-context";
import { ConfirmProvider } from "@/lib/confirm-context";
import { GlobalDragDropHandler } from "@/components/file-browser/GlobalDragDropHandler";
import { ClipboardProvider } from "@/lib/clipboard-context";

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
              <div className="h-screen bg-background overflow-hidden">
                {isAuthenticated ? (
                  <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-auto p-6">
                      {children}
                    </main>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <main className="flex-1 overflow-auto p-6">
                      {children}
                    </main>
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
