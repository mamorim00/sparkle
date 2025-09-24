// src/app/layout.tsx
import "../styles/globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Inter } from "next/font/google";
import { LocationProvider } from "../context/LocationContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Sparkle Cleaners",
  description: "Find trusted cleaners near you",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-background">
        {/* Wrap Navbar, children, Footer inside LocationProvider */}
        <LocationProvider>
          <Navbar />
          <main className="min-h-screen container mx-auto px-4 py-6">{children}</main>
          <Footer />
        </LocationProvider>
      </body>
    </html>
  );
}
