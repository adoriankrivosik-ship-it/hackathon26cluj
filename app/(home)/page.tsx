"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

function LogoIcon({
  variant = "default",
  className = "",
}: {
  variant?: "default" | "light";
  className?: string;
}) {
  const clipId = useId();
  const navy = "#0D1B2A";
  const gold = "#F0A500";
  const pinFill = variant === "light" ? "#FFFFFF" : navy;
  const innerFill = variant === "light" ? navy : "#FFFFFF";
  const gridStroke = variant === "light" ? "#FFFFFF" : navy;

  return (
    <svg
      viewBox="0 0 48 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="24" cy="20" r="10.5" />
        </clipPath>
      </defs>
      <path
        d="M24 2C14.06 2 6 10.06 6 20c0 11.25 18 36 18 36s18-24.75 18-36C42 10.06 33.94 2 24 2z"
        fill={pinFill}
      />
      <circle cx="24" cy="20" r="11" fill={innerFill} />
      <g
        clipPath={`url(#${clipId})`}
        stroke={gridStroke}
        strokeWidth="1.1"
        strokeLinecap="round"
      >
        <line x1="24" y1="11" x2="24" y2="29" />
        <line x1="15" y1="20" x2="33" y2="20" />
        <line x1="17.5" y1="13.5" x2="30.5" y2="26.5" />
        <line x1="30.5" y1="13.5" x2="17.5" y2="26.5" />
        <line x1="15" y1="14" x2="19" y2="18" />
        <line x1="29" y1="14" x2="33" y2="18" />
        <line x1="15" y1="26" x2="19" y2="22" />
        <line x1="29" y1="26" x2="33" y2="22" />
      </g>
      <circle cx="24" cy="20" r="3.25" fill={gold} />
    </svg>
  );
}

function LogoWordmark({
  variant = "default",
  className = "",
}: {
  variant?: "default" | "light";
  className?: string;
}) {
  const navyClass =
    variant === "light" ? "text-white" : "text-[#0D1B2A]";

  return (
    <span
      className={`font-extrabold tracking-tight lowercase ${className}`}
    >
      <span className={navyClass}>totul</span>
      <span className="text-[#F0A500]">cluj</span>
      <span className={navyClass}>.ro</span>
    </span>
  );
}

function Logo({
  className = "",
  variant = "default",
  layout = "horizontal",
}: {
  className?: string;
  variant?: "default" | "light";
  layout?: "horizontal" | "vertical";
}) {
  const isVertical = layout === "vertical";

  return (
    <div
      className={`flex items-center ${
        isVertical ? "flex-col gap-2 text-center" : "flex-row gap-2.5"
      } ${className}`}
      aria-label="Totulcluj.ro"
    >
      <LogoIcon
        variant={variant}
        className={isVertical ? "h-14 w-auto" : "h-10 w-auto shrink-0"}
      />
      <LogoWordmark
        variant={variant}
        className={isVertical ? "text-xl" : "text-lg sm:text-xl"}
      />
    </div>
  );
}

const FEATURES = [
  {
    icon: "🗺️",
    title: "Hartă interactivă",
    description:
      "Proiectele publice vizualizate pe cartiere, cu status în timp real.",
  },
  {
    icon: "⏱️",
    title: "Orașul de 15 minute",
    description:
      "Pinează-ți locația și descoperă ce ai la 15 minute distanță.",
  },
  {
    icon: "📋",
    title: "Detalii complete",
    description:
      "Buget, instituție responsabilă, sursă oficială și cronologie pentru fiecare proiect.",
  },
  {
    icon: "🤖",
    title: "Rezumate AI",
    description:
      "Descrierile birocratice traduse în limbaj uman, automat.",
  },
  {
    icon: "🔔",
    title: "Notificări",
    description:
      "Primești update când un proiect avansează, se blochează sau se finalizează.",
  },
  {
    icon: "🛠️",
    title: "Raportare probleme",
    description:
      "Sesizează probleme în oraș și urmărește rezolvarea lor.",
  },
] as const;

const AMENITIES = [
  { label: "Parc", angle: 0, color: "#F0A500" },
  { label: "Școală", angle: 60, color: "#64B5F6" },
  { label: "Spital", angle: 120, color: "#FFFFFF" },
  { label: "Autobuz", angle: 180, color: "#F0A500" },
  { label: "Primărie", angle: 240, color: "#64B5F6" },
  { label: "Piață", angle: 300, color: "#FFFFFF" },
] as const;

function FifteenMinVisualization() {
  const cx = 140;
  const cy = 140;
  const radius = 90;

  return (
    <svg
      viewBox="0 0 280 280"
      className="mx-auto w-full max-w-sm"
      aria-label="Vizualizare oraș 15 minute"
      role="img"
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius + 20}
        fill="none"
        stroke="white"
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.2"
      />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        opacity="0.35"
      />
      <circle
        cx={cx}
        cy={cy}
        r={radius - 30}
        fill="none"
        stroke="#64B5F6"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.4"
      />
      {AMENITIES.map(({ label, angle, color }) => {
        const rad = ((angle - 90) * Math.PI) / 180;
        const x = cx + radius * Math.cos(rad);
        const y = cy + radius * Math.sin(rad);
        const labelX = cx + (radius + 28) * Math.cos(rad);
        const labelY = cy + (radius + 28) * Math.sin(rad);
        return (
          <g key={label}>
            <line
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={color}
              strokeWidth="1"
              opacity="0.5"
            />
            <circle cx={x} cy={y} r="5" fill={color} opacity="0.9" />
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="10"
              fontWeight="500"
            >
              {label}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="8" fill="#F0A500" />
      <circle cx={cx} cy={cy} r="3" fill="#0D1B2A" />
    </svg>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("scroll-smooth");

    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.documentElement.classList.remove("scroll-smooth");
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${
          scrolled ? "shadow-md" : ""
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0A500] rounded-lg">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#despre"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-[#1A1A2E] transition-colors hover:bg-gray-100 sm:inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0A500]"
            >
              Despre
            </a>
            <Link
              href="/harta"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-[#1A1A2E] transition-colors hover:bg-gray-100 sm:inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0A500]"
            >
              Hartă
            </Link>
            <Link
              href="/harta"
              className="rounded-full bg-[#0D1B2A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#F0A500] hover:text-[#0D1B2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0A500] focus-visible:ring-offset-2"
            >
              Deschide harta
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative flex min-h-screen flex-col items-center justify-center bg-[#0D1B2A] px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="flex flex-1 flex-col items-center justify-center">
            <span className="mb-6 rounded-full bg-[#F0A500]/10 px-4 py-1.5 text-sm font-medium text-[#F0A500]">
              Cluj-Napoca · 2026
            </span>
            <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl">
              Tot ce se construiește în Cluj, într-un singur loc.
            </h1>
            <p className="mt-6 max-w-xl text-base font-normal leading-relaxed text-[#64B5F6] sm:text-lg">
              Urmărește proiectele publice din orașul tău — unde sunt, cât
              costă, când se termină — direct pe hartă, în timp real.
            </p>
            <div className="mt-10 flex w-full max-w-md flex-col items-center justify-center gap-4 sm:max-w-none sm:flex-row">
              <Link
                href="/harta"
                className="w-full rounded-full bg-[#F0A500] px-8 py-3.5 text-center text-sm font-bold text-[#0D1B2A] transition-opacity hover:opacity-90 sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0A500] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1B2A]"
              >
                Deschide harta
              </Link>
              <a
                href="#despre"
                className="w-full rounded-full border border-white px-8 py-3.5 text-center text-sm font-medium text-white transition-colors hover:bg-white/10 sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1B2A]"
              >
                Află mai mult
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-white">
                320.000 cetățeni
              </span>
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-white">
                200+ proiecte
              </span>
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-white">
                Date oficiale
              </span>
            </div>
          </div>
          <a
            href="#despre"
            className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-[#F0A500] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0A500] rounded"
            aria-label="Săgeată derulare în jos"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </a>
        </section>

        {/* Problem */}
        <section
          id="despre"
          className="scroll-mt-20 bg-white py-20 lg:py-24"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
            <div>
              <blockquote className="max-w-sm text-2xl font-extrabold italic leading-snug text-[#0D1B2A] lg:text-3xl">
                Ai trecut vreodată pe lângă un gard de șantier și nu ai știut
                ce se construiește în spatele lui?
              </blockquote>
              <div className="mt-8 space-y-4 text-base leading-relaxed text-[#6B7280]">
                <p>
                  Orașele europene sunt în plin șantier. Fonduri europene,
                  bugete locale, programe naționale — miliarde de euro se
                  cheltuiesc în jurul nostru. Dar informația rămâne îngropată
                  în PDF-uri bugetare pe care nimeni nu le citește.
                </p>
                <p>
                  Totulcluj.ro schimbă asta. Nu creăm date noi — luăm ce există
                  deja și îl facem vizibil, înțeles și urmăribil de oricine.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative h-64 w-full max-w-xs sm:max-w-sm">
                <div className="absolute left-4 top-8 w-56 rotate-[-4deg] rounded-xl border-l-4 border-[#F0A500] bg-white p-5 shadow-lg">
                  <div className="mb-3 h-2 w-3/4 rounded-full bg-gray-200" />
                  <div className="h-2 w-1/2 rounded-full bg-gray-100" />
                </div>
                <div className="absolute left-8 top-16 w-56 rotate-[2deg] rounded-xl border-l-4 border-[#64B5F6] bg-white p-5 shadow-lg">
                  <div className="mb-3 h-2 w-2/3 rounded-full bg-gray-200" />
                  <div className="h-2 w-3/5 rounded-full bg-gray-100" />
                </div>
                <div className="absolute left-12 top-24 w-56 rotate-[6deg] rounded-xl border-l-4 border-[#0D1B2A] bg-white p-5 shadow-lg">
                  <div className="mb-3 h-2 w-4/5 rounded-full bg-gray-200" />
                  <div className="h-2 w-1/2 rounded-full bg-gray-100" />
                </div>
              </div>
              <p className="mt-6 text-center text-sm text-[#6B7280]">
                Date publice, în sfârșit publice.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-[#F5F7FA] py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-[#0D1B2A] sm:text-4xl">
                Ce găsești pe platformă
              </h2>
              <p className="mt-4 text-lg font-medium text-[#6B7280]">
                O singură interfață pentru tot ce mișcă în orașul tău.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl bg-white p-6 shadow-sm lg:p-8"
                >
                  <span className="text-4xl" role="img" aria-hidden="true">
                    {feature.icon}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-[#0D1B2A]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 15-minute city */}
        <section className="bg-gradient-to-br from-[#0D1B2A] to-[#1A3A5C] py-20 lg:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
            <div>
              <span className="inline-block rounded-full bg-[#F0A500]/20 px-4 py-1 text-sm font-medium text-[#F0A500]">
                Funcție nouă
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-white lg:text-4xl">
                Orașul tău în 15 minute.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-white/80">
                Pinează-ți locația curentă și deblochează un cerc de 15 minute
                în jurul tău. Vezi instantaneu parcurile, spitalele, școlile,
                transportul public și serviciile din cartierul tău — și unde
                lipsesc.
              </p>
              <Link
                href="/harta"
                className="mt-8 inline-block rounded-full border-2 border-[#F0A500] px-6 py-3 text-sm font-semibold text-[#F0A500] transition-colors hover:bg-[#F0A500]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0A500]"
              >
                Încearcă pe hartă
              </Link>
            </div>
            <FifteenMinVisualization />
          </div>
        </section>

        {/* Civic impact */}
        <section className="bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-[#0D1B2A] sm:text-4xl">
              De ce contează
            </h2>
            <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8">
              <div>
                <p className="text-5xl font-extrabold text-[#F0A500] lg:text-6xl">
                  320.000
                </p>
                <p className="mx-auto mt-4 max-w-xs text-base text-[#0D1B2A]">
                  cetățeni care merită să știe ce se construiește în orașul lor
                </p>
              </div>
              <div>
                <p className="text-5xl font-extrabold text-[#F0A500] lg:text-6xl">
                  200+
                </p>
                <p className="mx-auto mt-4 max-w-xs text-base text-[#0D1B2A]">
                  proiecte publice vizibile în bugetul Cluj 2026
                </p>
              </div>
              <div>
                <p className="text-5xl font-extrabold text-[#F0A500] lg:text-6xl">
                  15 min
                </p>
                <p className="mx-auto mt-4 max-w-xs text-base text-[#0D1B2A]">
                  distanța la care ar trebui să ai tot ce-ți trebuie în fiecare
                  zi
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0D1B2A] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-3 md:gap-8">
            <div>
              <Logo variant="light" layout="vertical" />
              <p className="mt-4 max-w-xs text-sm text-white/50">
                Transparență urbană pentru Cluj-Napoca.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 md:justify-center">
              <Link
                href="/harta"
                className="text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0A500]"
              >
                Hartă
              </Link>
              <a
                href="#despre"
                className="text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0A500]"
              >
                Despre
              </a>
              <a
                href="#"
                className="text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0A500]"
              >
                Raportare
              </a>
              <a
                href="#"
                className="text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0A500]"
              >
                Contact
              </a>
            </nav>
            <div className="md:text-right">
              <p className="text-sm text-white/50">
                Un proiect construit la Cluj Hackathon 2026
              </p>
              <span className="mt-3 inline-block rounded-full bg-[#F0A500]/20 px-3 py-1 text-xs font-semibold text-[#F0A500]">
                Digital Romania
              </span>
            </div>
          </div>
          <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/40">
            © 2026 Totulcluj.ro — date.gov.ro · SEAP · Primăria Cluj-Napoca
          </div>
        </div>
      </footer>
    </>
  );
}
