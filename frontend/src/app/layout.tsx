import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { Toaster } from "react-hot-toast";

const jakarta = Plus_Jakarta_Sans({ 
    subsets: ["latin"],
    variable: "--font-jakarta",
    display: "swap",
});

export const metadata: Metadata = {
  title: "GarageNow | On-Demand Auto Garage Service",
  description: "Get real-time roadside assistance and mechanic services. Slippery smooth, lightning fast.",
};

export const viewport = { 
  width: 'device-width', 
  initialScale: 1, 
  maximumScale: 1 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans min-h-screen w-full flex flex-col bg-[#F8F9FA] text-slate-900 selection:bg-yellow-200 antialiased`}>
        <AuthProvider>
          <SocketProvider>
            <Toaster position="top-right" />
            <main className="flex-grow w-full relative z-0">
              {children}
            </main>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
