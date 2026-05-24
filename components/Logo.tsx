import Link from "next/link";

interface LogoProps {
  className?: string;
  light?: boolean;
}

export function Logo({ className = "", light = false }: LogoProps) {
  return (
    <Link
      href="/"
      className={`font-bold tracking-tight ${light ? "text-white" : "text-[#0D1B2A]"} ${className}`}
    >
      totulcluj<span className="text-[#F0A500]">.ro</span>
    </Link>
  );
}
