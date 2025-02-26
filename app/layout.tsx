// nextjs
import type { Metadata } from "next";
import localFont from "next/font/local";

// styles
import "./globals.css";

// contexts
import ApolloContext from "@/contexts/ApolloContext";
import AuthContext from "@/contexts/AuthContext";
import UserNotificationsCountContext from "@/contexts/UserNotificationsCountContext";

// utils
import { Toaster } from "sonner";

// components
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/sidebar/Sidebar";
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
  description: "Graphql App for communication",
  keywords:
    "Ahmed Tarek social media app, Ahmed Social media app, Social Media, Social Media App, Graphql, Graphql social media app, communication app",
  authors: {
    name: "Ahmed Tarek",
    url: "https://github.com/ahmedtarekwork",
  },

  openGraph: {
    url: "https://graphql-social-media.vercel.app",
    type: "website",
    title: "Graphql Social Media",
    description: "Graphql App for communication",
    images: ["https://graphql-social-media.vercel.app/og_img.webp"],
    siteName: "Graphql Social Media",
  },
  twitter: {
    description: "Graphql App for communication",
    images: ["https://graphql-social-media.vercel.app/og_img.webp"],
    title: "Graphql social media app",
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* veryfiy google search console */}
        <meta
          name="google-site-verification"
          content="Ggke0z6Sln6NQG9ngm9QUMfrzX7josJRNWfSv4mta9E"
        />

        {/* Twitter Meta Tags */}
        <meta property="twitter:domain" content="ahmed-profile.vercel.app" />
        <meta
          property="twitter:url"
          content="https://ahmed-profile.vercel.app"
        />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ApolloContext>
          <Toaster richColors />

          <AuthContext>
            <UserNotificationsCountContext>
              <SidebarProvider defaultOpen={false}>
                <Header />
                <Sidebar />
              </SidebarProvider>

              <main className="flex-1 flex flex-col container my-4">
                {children}
              </main>
            </UserNotificationsCountContext>

            <Footer />
          </AuthContext>
        </ApolloContext>
      </body>
    </html>
  );
}
