import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "800"],
  display: "swap",
});

export default function HomeLayout({
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
