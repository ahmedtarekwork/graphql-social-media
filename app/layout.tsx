// nextjs
import type { Metadata } from "next";
import localFont from "next/font/local";

// styles
import "./globals.css";

// react
import { Suspense } from "react";

// contexts
import ApolloContext from "@/contexts/ApolloContext";
import AuthContext from "@/contexts/AuthContext";
import UserNotificationsCountContext from "@/contexts/UserNotificationsCountContext";
import PostsProvider from "@/contexts/PostsContext";

// utils
import { Toaster } from "sonner";

// components
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sidebar from "@/components/sidebar/Sidebar";
import Loading from "./loading";
// shadcn
import { SidebarProvider } from "@/components/ui/sidebar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Social Media App",
  description: "App for communication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Suspense fallback={<Loading />}>
          <ApolloContext>
            <Toaster richColors />

            <AuthContext>
              <UserNotificationsCountContext>
                <SidebarProvider defaultOpen={false}>
                  <Header />
                  <Sidebar />
                </SidebarProvider>

                <PostsProvider>
                  <main className="flex-1 flex flex-col container my-4">
                    {children}
                  </main>
                </PostsProvider>
              </UserNotificationsCountContext>

              <Footer />
            </AuthContext>
          </ApolloContext>
        </Suspense>
      </body>
    </html>
  );
}
