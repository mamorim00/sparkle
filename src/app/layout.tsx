
// ===== src/app/layout.tsx =====
import "../styles/globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Poppins } from "next/font/google";
import { LocationProvider } from "../context/LocationContext";

const inter = Poppins({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800'], // Multiple weights for flexibility
  display: 'swap',
});

export const metadata = {
  title: "Sparkle Cleaners",
  description: "Find trusted cleaners near you",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <LocationProvider>
          <Navbar />
          {children}
          <Footer />
        </LocationProvider>
      </body>
    </html>
  );
}
