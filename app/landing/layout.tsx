import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Totulcluj.ro — Transparență urbană Cluj-Napoca",
  description:
    "Urmărește proiectele publice din orașul tău — unde sunt, cât costă, când se termină — direct pe hartă, în timp real.",
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${plusJakarta.className} min-h-screen bg-[#F5F7FA] text-[#1A1A2E] antialiased`}
    >
      {children}
    </div>
  );
}
