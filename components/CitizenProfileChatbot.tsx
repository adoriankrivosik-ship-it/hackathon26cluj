"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CitizenAnswers,
  CitizenProfile,
  CitizenProfileGenerationResult,
  CitizenProfileWeights,
} from "@/lib/citizen-profile-types";
import {
  createEmptyAnswers,
  EXTRA_CHIP_SUGGESTIONS,
  FAMILY_OPTIONS,
  getWeightLabel,
  LIFESTYLE_OPTIONS,
  PRIORITY_OPTIONS,
  TRANSPORT_OPTIONS,
} from "@/lib/citizen-profile-types";

const LOADING_MESSAGES = [
  "Analizez preferințele tale...",
  "Calculez profilul optim...",
  "Personalizez harta pentru tine...",
] as const;

const WEIGHT_KEYS: (keyof CitizenProfileWeights)[] = [
  "education",
  "health",
  "parks",
  "transport",
  "commercial",
  "culture",
  "sport",
  "restaurants",
  "banks",
];

type FlowStep = 0 | 1 | 2 | 3 | 4 | 5 | "loading" | "result";

interface CitizenProfileChatbotProps {
  open: boolean;
  citizenName: string;
  hasExistingProfile: boolean;
  initialAnswers?: CitizenAnswers | null;
  onClose: () => void;
  onProfileApplied: (profile: CitizenProfile, answers: CitizenAnswers) => void;
}

function ProgressBar({ step }: { step: FlowStep }) {
  if (step === "loading" || step === "result" || step === 0) return null;
  const current = typeof step === "number" ? step : 0;
  const pct = (current / 5) * 100;
  return (
    <div className="shrink-0 px-5 pt-4">
      <div className="mb-1 flex justify-between text-xs text-gray-500">
        <span>Pasul {current} din 5</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[#F0A500] transition-all duration-250 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function LoadingDonut({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
      <div
        className="relative h-14 w-14"
        aria-hidden="true"
      >
        <div className="absolute inset-0 rounded-full border-4 border-[#F0A500]/20" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#F0A500] border-r-[#F0A500]/60" />
      </div>
      {label && (
        <p className="max-w-[280px] text-center text-sm font-medium text-[#0D1B2A]">
          {label}
        </p>
      )}
    </div>
  );
}

function Chip({
  selected,
  onClick,
  emoji,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  emoji?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
        selected
          ? "border-[#F0A500] bg-[#F0A500]/15 text-[#0D1B2A]"
          : "border-gray-200 bg-white text-gray-700 hover:border-[#F0A500]/60"
      }`}
    >
      {emoji && <span aria-hidden="true">{emoji}</span>}
      {children}
    </button>
  );
}

export function CitizenProfileChatbot({
  open,
  citizenName,
  hasExistingProfile,
  initialAnswers,
  onClose,
  onProfileApplied,
}: CitizenProfileChatbotProps) {
  const [step, setStep] = useState<FlowStep>(hasExistingProfile ? 1 : 0);
  const [answers, setAnswers] = useState<CitizenAnswers>(
    initialAnswers ?? createEmptyAnswers(),
  );
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [customChip, setCustomChip] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generationMeta, setGenerationMeta] = useState<{
    source: CitizenProfileGenerationResult["source"];
    warnings: string[];
    aiConfigured: boolean;
  } | null>(null);

  const firstName = citizenName.split(/\s+/)[0] ?? citizenName;

  useEffect(() => {
    if (!open) return;
    setAnswers(initialAnswers ?? createEmptyAnswers());
    setProfile(null);
    setError(null);
    setSubmitting(false);
    setGenerationMeta(null);
    setStep(hasExistingProfile ? 1 : 0);
  }, [open, hasExistingProfile, initialAnswers]);

  useEffect(() => {
    if (step !== "loading") return;
    const id = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(id);
  }, [step]);

  const goTo = useCallback((next: FlowStep) => {
    setStep(next);
  }, []);

  const toggleLifestyle = (label: string) => {
    setAnswers((a) => ({
      ...a,
      lifestyle: a.lifestyle.includes(label)
        ? a.lifestyle.filter((x) => x !== label)
        : [...a.lifestyle, label],
    }));
  };

  const toggleFamily = (label: string) => {
    setAnswers((a) => ({
      ...a,
      family: a.family.includes(label)
        ? a.family.filter((x) => x !== label)
        : [...a.family, label],
    }));
  };

  const toggleExtraChip = (chip: string) => {
    setAnswers((a) => ({
      ...a,
      extra_chips: a.extra_chips.includes(chip)
        ? a.extra_chips.filter((x) => x !== chip)
        : [...a.extra_chips, chip],
    }));
  };

  const tapPriority = (key: string) => {
    setAnswers((a) => {
      const idx = a.priorities.indexOf(key);
      if (idx >= 0) {
        return {
          ...a,
          priorities: a.priorities.filter((k) => k !== key),
        };
      }
      return { ...a, priorities: [...a.priorities, key] };
    });
  };

  const addCustomChip = () => {
    const text = customChip.trim();
    if (!text) return;
    setAnswers((a) => ({
      ...a,
      extra_chips: a.extra_chips.includes(text)
        ? a.extra_chips
        : [...a.extra_chips, text],
    }));
    setCustomChip("");
  };

  const submitProfile = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    goTo("loading");
    try {
      const res = await fetch("/api/citizen/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const data = (await res.json()) as {
        profile?: CitizenProfile;
        error?: string;
        source?: CitizenProfileGenerationResult["source"];
        warnings?: string[];
        aiConfigured?: boolean;
      };

      if (!res.ok || !data.profile) {
        const messages = [
          data.error ?? "Generarea profilului a eșuat.",
          ...(data.warnings ?? []),
        ].filter(Boolean);
        setError(messages.join(" "));
        goTo(5);
        return;
      }

      setProfile(data.profile);
      setGenerationMeta({
        source: data.source ?? "heuristic",
        warnings: data.warnings ?? [],
        aiConfigured: data.aiConfigured ?? false,
      });
      goTo("result");
    } catch {
      setError(
        "Nu s-a putut contacta serverul. Verifică conexiunea și încearcă din nou.",
      );
      goTo(5);
    } finally {
      setSubmitting(false);
    }
  };

  const topWeights = useMemo(() => {
    if (!profile) return [];
    return WEIGHT_KEYS.map((key) => ({ key, value: profile.weights[key] }))
      .filter((w) => w.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [profile]);

  const excludedLabels = useMemo(() => {
    if (!profile) return [];
    return profile.excluded_categories.length > 0
      ? profile.excluded_categories
      : WEIGHT_KEYS.filter((k) => profile.weights[k] <= 0).map((k) =>
          getWeightLabel(k),
        );
  }, [profile]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-[#0D1B2A]/50 backdrop-blur-[2px] transition-opacity duration-200"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="citizen-profile-title"
        className="fixed inset-0 z-[61] flex items-center justify-center p-0 sm:p-4"
      >
        <div
          className="relative flex h-full max-h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <ProgressBar step={step} />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col">
              {step === 0 && (
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
                  <div className="text-center">
                    <span className="text-4xl" aria-hidden="true">
                      ✨
                    </span>
                    <h2
                      id="citizen-profile-title"
                      className="mt-4 text-xl font-semibold text-[#0D1B2A]"
                    >
                      Bună {firstName}! Hai să găsim cartierul perfect pentru
                      tine.
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                      Îți pun 5 întrebări scurte — durează 2 minute.
                    </p>
                  </div>
                  <div className="mt-auto pt-8">
                    <button
                      type="button"
                      onClick={() => goTo(1)}
                      className="w-full min-h-[44px] rounded-xl bg-[#0D1B2A] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a2d42]"
                    >
                      Începe
                    </button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <StepShell
                  title="Cum arată ziua ta ideală?"
                  onBack={
                    hasExistingProfile ? onClose : () => goTo(0)
                  }
                  onContinue={() => goTo(2)}
                  canContinue={answers.lifestyle.length >= 1}
                  showBack
                >
                  <div className="flex flex-wrap gap-2">
                    {LIFESTYLE_OPTIONS.map((opt) => (
                      <Chip
                        key={opt.label}
                        selected={answers.lifestyle.includes(opt.label)}
                        onClick={() => toggleLifestyle(opt.label)}
                        emoji={opt.emoji}
                      >
                        {opt.label}
                      </Chip>
                    ))}
                  </div>
                </StepShell>
              )}

              {step === 2 && (
                <StepShell
                  title="Cum te deplasezi cel mai des?"
                  onBack={() => goTo(1)}
                  onContinue={() => goTo(3)}
                  canContinue={answers.transport.length > 0}
                >
                  <div className="grid grid-cols-2 gap-3">
                    {TRANSPORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() =>
                          setAnswers((a) => ({ ...a, transport: opt.label }))
                        }
                        className={`flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
                          answers.transport === opt.label
                            ? "border-[#F0A500] bg-[#F0A500]/10"
                            : "border-gray-200 hover:border-[#F0A500]/50"
                        }`}
                        aria-pressed={answers.transport === opt.label}
                      >
                        <span className="text-3xl" aria-hidden="true">
                          {opt.emoji}
                        </span>
                        <span className="text-sm font-medium text-gray-800">
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </StepShell>
              )}

              {step === 3 && (
                <StepShell
                  title="Ordonează după importanță pentru tine:"
                  subtitle='Apasă pe categorii în ordinea preferințelor. Lasă jos categoriile care nu contează pentru tine.'
                  onBack={() => goTo(2)}
                  onContinue={() => goTo(4)}
                  canContinue={answers.priorities.length >= 1}
                >
                  <div className="space-y-2">
                    {PRIORITY_OPTIONS.map((opt) => {
                      const rank = answers.priorities.indexOf(opt.key);
                      const isRanked = rank >= 0;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => tapPriority(opt.key)}
                          className={`flex w-full min-h-[44px] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
                            isRanked
                              ? "border-[#F0A500] bg-[#F0A500]/10"
                              : "border-gray-200 bg-gray-50/50"
                          }`}
                          aria-label={`${opt.label}${isRanked ? `, prioritate ${rank + 1}` : ""}`}
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              isRanked
                                ? "bg-[#F0A500] text-white"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {isRanked ? rank + 1 : "—"}
                          </span>
                          <span className="text-lg" aria-hidden="true">
                            {opt.emoji}
                          </span>
                          <span className="text-sm font-medium text-gray-800">
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </StepShell>
              )}

              {step === 4 && (
                <StepShell
                  title="Cu cine locuiești sau plănuiești să locuiești?"
                  onBack={() => goTo(3)}
                  onContinue={() => goTo(5)}
                  canContinue
                >
                  <div className="flex flex-wrap gap-2">
                    {FAMILY_OPTIONS.map((opt) => (
                      <Chip
                        key={opt.label}
                        selected={answers.family.includes(opt.label)}
                        onClick={() => toggleFamily(opt.label)}
                        emoji={opt.emoji}
                      >
                        {opt.label}
                      </Chip>
                    ))}
                  </div>
                </StepShell>
              )}

              {step === 5 && (
                <div className="flex min-h-0 flex-1 flex-col px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <h2 className="text-lg font-semibold text-[#0D1B2A]">
                      E ceva specific important pentru tine? (opțional)
                    </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {EXTRA_CHIP_SUGGESTIONS.map((chip) => (
                      <Chip
                        key={chip}
                        selected={answers.extra_chips.includes(chip)}
                        onClick={() => toggleExtraChip(chip)}
                      >
                        {chip}
                      </Chip>
                    ))}
                    {answers.extra_chips
                      .filter((c) => !EXTRA_CHIP_SUGGESTIONS.includes(c as never))
                      .map((chip) => (
                        <Chip
                          key={chip}
                          selected
                          onClick={() => toggleExtraChip(chip)}
                        >
                          {chip}
                        </Chip>
                      ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={customChip}
                      onChange={(e) => setCustomChip(e.target.value)}
                      placeholder="Scrie orice altceva..."
                      className="min-h-[44px] flex-1 rounded-xl border border-gray-200 px-3 text-sm focus:border-[#F0A500] focus:outline-none focus:ring-2 focus:ring-[#F0A500]/30"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addCustomChip();
                      }}
                    />
                    <button
                      type="button"
                      onClick={addCustomChip}
                      className="shrink-0 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:border-[#F0A500]"
                    >
                      Altă opțiune
                    </button>
                  </div>
                  <textarea
                    className="mt-3 min-h-[72px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#F0A500] focus:outline-none focus:ring-2 focus:ring-[#F0A500]/30"
                    placeholder="Detalii suplimentare..."
                    value={answers.freetext}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, freetext: e.target.value }))
                    }
                  />
                  {error && (
                    <div
                      className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                      role="alert"
                    >
                      {error}
                    </div>
                  )}
                  </div>
                  <div className="mt-4 shrink-0 flex flex-col gap-2 border-t border-gray-100 bg-white pt-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => goTo(4)}
                        disabled={submitting}
                        className="min-h-[44px] flex-1 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 disabled:opacity-50"
                      >
                        Înapoi
                      </button>
                      <button
                        type="button"
                        onClick={() => void submitProfile()}
                        disabled={submitting}
                        className="min-h-[44px] flex-1 rounded-xl bg-[#0D1B2A] px-4 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {submitting ? "Se generează…" : "Generează profilul"}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => void submitProfile()}
                      disabled={submitting}
                      className="min-h-[44px] text-sm font-medium text-gray-500 underline-offset-2 hover:text-[#0D1B2A] hover:underline disabled:opacity-50"
                    >
                      Sari peste (fără detalii extra)
                    </button>
                  </div>
                </div>
              )}

              {step === "loading" && (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-12 text-center">
                  <span className="mb-2 text-4xl" aria-hidden="true">
                    ✨
                  </span>
                  <LoadingDonut label={LOADING_MESSAGES[loadingMsgIdx]} />
                  <p className="mt-4 text-xs text-gray-500">
                    Poate dura până la 30 de secunde…
                  </p>
                </div>
              )}

              {step === "result" && profile && (
                <div className="flex min-h-0 flex-1 flex-col px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {generationMeta && generationMeta.warnings.length > 0 && (
                    <div
                      className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs leading-relaxed text-amber-900"
                      role="status"
                    >
                      <p className="font-semibold">
                        {generationMeta.source === "ai"
                          ? "Profil generat cu AI"
                          : "Profil calculat local"}
                        {!generationMeta.aiConfigured && " (fără cheie OpenRouter)"}
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-4">
                        {generationMeta.warnings.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-[64px] leading-none" aria-hidden="true">
                      {profile.profile_emoji}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-[#0D1B2A]">
                      {profile.profile_name}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {profile.profile_summary}
                    </p>
                  </div>

                  <div className="mt-6 space-y-3">
                    {topWeights.map(({ key, value }) => (
                      <div key={key}>
                        <div className="mb-1 flex justify-between text-xs text-gray-600">
                          <span>{getWeightLabel(key)}</span>
                          <span>{Math.round(value * 100)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-[#F0A500] transition-all duration-250"
                            style={{ width: `${value * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {excludedLabels.length > 0 && (
                    <p className="mt-4 text-sm text-gray-500">
                      🚫 Nu contează: {excludedLabels.join(", ")}
                    </p>
                  )}
                  </div>

                  <div className="mt-4 shrink-0 flex flex-col gap-2 border-t border-gray-100 bg-white pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        onProfileApplied(profile, answers);
                        onClose();
                      }}
                      className="min-h-[44px] w-full rounded-xl bg-[#0D1B2A] px-4 py-3 text-sm font-semibold text-white"
                    >
                      Aplică pe hartă
                    </button>
                    <button
                      type="button"
                      onClick={() => goTo(1)}
                      className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700"
                    >
                      Refă profilul
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-2 text-gray-400 hover:bg-gray-100"
            aria-label="Închide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

function StepShell({
  title,
  subtitle,
  children,
  onBack,
  onContinue,
  canContinue,
  showBack = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
  showBack?: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="shrink-0">
        <h2 className="text-lg font-semibold text-[#0D1B2A]">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        {children}
      </div>
      <div className="mt-4 shrink-0 flex gap-2 border-t border-gray-100 bg-white pt-4">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] flex-1 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700"
          >
            Înapoi
          </button>
        )}
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="min-h-[44px] flex-1 rounded-xl bg-[#0D1B2A] px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          Continuă
        </button>
      </div>
    </div>
  );
}
