import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext"; // AuthProvider'ı import et
import Navbar from "@/components/Navbar"; // Navbar'ı import et

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eventix Bilet Satış",
  description: "En iyi etkinlikler için bilet alın.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider> {/* Tüm uygulamayı AuthProvider ile sarmala */}
          <Navbar /> {/* Navbar'ı her sayfanın üstünde göster */}
          <main>{children}</main> {/* Sayfa içeriği burada görünecek */}
        </AuthProvider>
      </body>
    </html>
  );
}