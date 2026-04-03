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
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans bg-slate-900 text-slate-200 antialiased`}>
        <AuthProvider>
          <SocketProvider>
            <Toaster 
              position="top-center"
              toastOptions={{
                className: 'glass-card !text-white !rounded-3xl !py-4 !px-6',
                style: {
                  background: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
                },
              }}
            />
            <div className="min-h-screen flex flex-col">
              {children}
            </div>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
