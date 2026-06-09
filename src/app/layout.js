import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://admin.famtech.llc"),
  title: "FamTech Admin Portal",
  description: "Administrator access portal for the Famtech platform.",
  openGraph: {
    type: "website",
    url: "https://admin.famtech.llc",
    siteName: "Famtech Admin",
    title: "FamTech Admin Portal",
    description: "Administrator access portal for the Famtech platform.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Famtech Admin" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FamTech Admin Portal",
    description: "Administrator access portal for the Famtech platform.",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
