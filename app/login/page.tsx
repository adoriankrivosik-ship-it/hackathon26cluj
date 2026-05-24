"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Logo } from "@/components/Logo";

const OTP_LENGTH = 6;
const TIMER_SECONDS = 120;

type Step = "credentials" | "2fa";
type LoginType = "citizen" | "admin";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "e***@***.ro";
  return `${local[0]}***@${domain}`;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function PersonIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ShieldIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LoginTypePicker() {
  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-gray-500">
        Alege tipul de cont
      </p>
      <Link
        href="/login?type=citizen"
        className="flex items-center gap-3 rounded-xl border-2 border-[#0D1B2A]/15 px-4 py-4 transition-colors hover:border-[#F0A500] hover:bg-[#F0A500]/5"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F7FA] text-[#0D1B2A]">
          <PersonIcon />
        </span>
        <span>
          <span className="block font-semibold text-[#0D1B2A]">
            Intru ca cetățean
          </span>
          <span className="text-xs text-gray-500">
            Salvează locații favorite pe hartă
          </span>
        </span>
      </Link>
      <Link
        href="/login?type=admin"
        className="flex items-center gap-3 rounded-xl bg-[#F0A500] px-4 py-4 text-[#0D1B2A] transition-opacity hover:opacity-90"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0D1B2A]/10">
          <ShieldIcon />
        </span>
        <span>
          <span className="block font-semibold">
            Intru ca funcționar / admin
          </span>
          <span className="text-xs opacity-80">Panou administrare</span>
        </span>
      </Link>
    </div>
  );
}

function OtpInput({
  digits,
  onChange,
  onComplete,
  disabled,
  shake,
}: {
  digits: string[];
  onChange: (index: number, value: string) => void;
  onComplete: (code: string) => void;
  disabled: boolean;
  shake: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (digits.every((d) => d !== "") && !disabled) {
      onComplete(digits.join(""));
    }
  }, [digits, disabled, onComplete]);

  function handleChange(index: number, raw: string) {
    const value = raw.replace(/\D/g, "").slice(-1);
    onChange(index, value);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      onChange(index - 1, "");
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    pasted.split("").forEach((char, i) => onChange(i, char));
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  return (
    <div
      className={`flex justify-center gap-2 sm:gap-3 ${shake ? "animate-login-shake" : ""}`}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Cifra ${index + 1} din 6`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="h-14 w-12 rounded-lg border border-gray-300 text-center text-lg font-semibold text-[#0D1B2A] transition-shadow focus:border-[#F0A500] focus:outline-none focus:ring-2 focus:ring-[#F0A500]/40 disabled:opacity-50 max-sm:h-12 max-sm:w-10"
        />
      ))}
    </div>
  );
}

function TwoFactorStep({
  email,
  password,
  redirectTo,
  onBack,
}: {
  email: string;
  password: string;
  redirectTo: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill(""),
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [toast, setToast] = useState("");
  const [resending, setResending] = useState(false);
  const expired = secondsLeft <= 0;

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const verifyCode = useCallback(
    async (code: string) => {
      if (loading || expired) return;
      setError("");
      setLoading(true);
      try {
        const res = await fetch("/api/auth/verify-2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = (await res.json()) as {
          error?: string;
          redirect?: string;
        };
        if (!res.ok) {
          setError(data.error ?? "Cod incorect. Încearcă din nou.");
          setShake(true);
          setTimeout(() => setShake(false), 500);
          return;
        }
        router.push(data.redirect ?? redirectTo);
        router.refresh();
      } catch {
        setError("Eroare de rețea. Încercați din nou.");
      } finally {
        setLoading(false);
      }
    },
    [loading, expired, redirectTo, router],
  );

  function handleDigitChange(index: number, value: string) {
    setDigits((prev) => {
      const nextDigits = [...prev];
      nextDigits[index] = value;
      return nextDigits;
    });
    setError("");
  }

  async function handleResend() {
    if (!expired || resending) return;
    setResending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string; step?: string };
      if (!res.ok || data.step !== "2fa") {
        setError(data.error ?? "Nu s-a putut retrimite codul.");
        return;
      }
      setDigits(Array(OTP_LENGTH).fill(""));
      setSecondsLeft(TIMER_SECONDS);
      setToast("Cod nou trimis!");
    } catch {
      setError("Eroare de rețea. Încercați din nou.");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== OTP_LENGTH) return;
    await verifyCode(code);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-[#0D1B2A]">
          Verificare în doi pași
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Am trimis un cod la adresa {maskEmail(email)}
        </p>
      </div>

      {toast && (
        <p
          className="rounded-lg bg-[#F0A500]/15 px-3 py-2 text-center text-sm font-medium text-[#0D1B2A]"
          role="status"
        >
          {toast}
        </p>
      )}

      <OtpInput
        digits={digits}
        onChange={handleDigitChange}
        onComplete={verifyCode}
        disabled={loading || expired}
        shake={shake}
      />

      <p
        className={`text-center text-sm ${expired ? "font-medium text-red-600" : "text-gray-500"}`}
      >
        {expired
          ? "Codul a expirat"
          : `Codul expiră în ${formatTimer(secondsLeft)}`}
      </p>

      {error && (
        <p className="text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleResend}
        disabled={!expired || resending}
        className="w-full text-sm font-medium text-[#0D1B2A] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
      >
        {resending ? "Se retrimite..." : "Retrimite cod"}
      </button>

      <button
        type="submit"
        disabled={loading || expired || digits.some((d) => !d)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F0A500] py-2.5 text-sm font-semibold text-[#0D1B2A] hover:bg-[#e09500] disabled:opacity-50"
      >
        {loading && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-[#0D1B2A]/30 border-t-[#0D1B2A]"
            aria-hidden="true"
          />
        )}
        Verifică
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-gray-500 hover:text-[#0D1B2A]"
      >
        Înapoi
      </button>
    </form>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const loginType: LoginType | null =
    typeParam === "citizen" || typeParam === "admin" ? typeParam : null;

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState(
    loginType === "citizen" ? "/harta" : "/admin/projects",
  );

  const copy =
    loginType === "citizen"
      ? {
          title: "Autentificare cetățean",
          subtitle: "Salvează locațiile tale favorite pe hartă",
          placeholder: "ion.popescu@gmail.com",
        }
      : {
          title: "Autentificare panou administrare",
          subtitle: null as string | null,
          placeholder: "functionar@primarie.cluj",
        };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        error?: string;
        step?: string;
        redirect?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Autentificare eșuată.");
        return;
      }
      if (data.redirect) {
        setRedirectTo(data.redirect);
      }
      if (data.step === "2fa") {
        setStep("2fa");
        return;
      }
      router.push(data.redirect ?? redirectTo);
      router.refresh();
    } catch {
      setError("Eroare de rețea. Încercați din nou.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBack() {
    await fetch("/api/auth/verify-2fa", { method: "DELETE" });
    setStep("credentials");
    setError("");
  }

  if (!loginType) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <Logo className="text-xl justify-center inline-block" />
            <p className="mt-2 text-sm text-gray-500">Autentificare</p>
          </div>
          <LoginTypePicker />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <p className="mb-6 text-center">
          <Logo className="text-xl justify-center inline-block" />
          {step === "credentials" && (
            <>
              <span className="mt-2 block text-sm font-medium text-[#0D1B2A]">
                {copy.title}
              </span>
              {copy.subtitle && (
                <span className="mt-1 block text-xs text-gray-500">
                  {copy.subtitle}
                </span>
              )}
            </>
          )}
        </p>

        <div className="relative overflow-hidden">
          <div
            className={`transition-all duration-300 ease-out ${
              step === "credentials"
                ? "translate-y-0 opacity-100"
                : "pointer-events-none absolute inset-0 -translate-y-2 opacity-0"
            }`}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder={copy.placeholder}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Parolă
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              {error && step === "credentials" && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#F0A500] py-2.5 text-sm font-semibold text-[#0D1B2A] hover:bg-[#e09500] disabled:opacity-50"
              >
                {loading ? "Se conectează..." : "Autentificare"}
              </button>
              <Link
                href="/login"
                className="block text-center text-sm text-gray-500 hover:text-[#0D1B2A]"
              >
                Înapoi la alegere tip cont
              </Link>
            </form>
          </div>

          <div
            className={`transition-all duration-300 ease-out ${
              step === "2fa"
                ? "translate-y-0 opacity-100"
                : "pointer-events-none absolute inset-0 translate-y-2 opacity-0"
            }`}
          >
            {step === "2fa" && (
              <TwoFactorStep
                email={email}
                password={password}
                redirectTo={redirectTo}
                onBack={handleBack}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F7FA]" />}>
      <LoginForm />
    </Suspense>
  );
}
