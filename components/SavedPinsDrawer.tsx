"use client";

import { useState } from "react";
import { WALK_CATEGORIES } from "@/lib/walkscore-config";
import { scoreToColor } from "@/lib/walkscore-colors";
import type { WalkScoreScores } from "@/lib/walkscore-types";
import type { DbSavedPin } from "@/lib/saved-pins-types";
import { parseSavedPinScores } from "@/lib/saved-pins-types";
import type { CitizenProfile } from "@/lib/citizen-profile-types";
import {
  getWeightLabel,
  type CitizenProfileWeights,
} from "@/lib/citizen-profile-types";

interface SavedPinsDrawerProps {
  open: boolean;
  pins: DbSavedPin[];
  loading: boolean;
  profile: CitizenProfile | null;
  onClose: () => void;
  onSelectPin: (pin: DbSavedPin) => void;
  onDeletePin: (id: string) => void;
  onEditProfile: () => void;
  onDeleteProfile: () => void;
}

function formatPinDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function topCategories(scores: WalkScoreScores | null): {
  key: string;
  label: string;
  score: number;
  color: string;
}[] {
  if (!scores) return [];
  return WALK_CATEGORIES.map((cat) => ({
    key: cat.key,
    label: cat.label,
    score: scores[cat.key] ?? 0,
    color: cat.color,
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

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

export function SavedPinsDrawer({
  open,
  pins,
  loading,
  profile,
  onClose,
  onSelectPin,
  onDeletePin,
  onEditProfile,
  onDeleteProfile,
}: SavedPinsDrawerProps) {
  const [confirmDeleteProfile, setConfirmDeleteProfile] = useState(false);

  const profileTopWeights = profile
    ? WEIGHT_KEYS.map((key) => ({ key, value: profile.weights[key] }))
        .filter((w) => w.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 4)
    : [];

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
        onClick={onClose}
      />
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[300px] max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
        aria-label="Pinii mei salvați"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">
              ❤️
            </span>
            <h2 className="text-base font-semibold text-gray-900">Pinii mei</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
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

        <div className="flex-1 overflow-y-auto p-3">
          {profile && (
            <div className="mb-3 rounded-xl border border-[#F0A500]/30 bg-[#F0A500]/5 p-3">
              <div className="flex items-start gap-2">
                <span className="text-2xl" aria-hidden="true">
                  {profile.profile_emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#0D1B2A]">
                    {profile.profile_name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-600">
                    {profile.profile_summary}
                  </p>
                </div>
              </div>
              {profileTopWeights.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {profileTopWeights.map(({ key, value }) => (
                    <div key={key}>
                      <div className="mb-0.5 flex justify-between text-[10px] text-gray-500">
                        <span>{getWeightLabel(key)}</span>
                        <span>{Math.round(value * 100)}%</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-[#F0A500]"
                          style={{ width: `${value * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={onEditProfile}
                  className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 hover:border-[#F0A500]"
                  aria-label="Editează profilul"
                >
                  ✏️ Editează
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteProfile(true)}
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  aria-label="Șterge profilul"
                >
                  🗑️ Șterge
                </button>
              </div>
            </div>
          )}

          {confirmDeleteProfile && (
            <div
              className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3"
              role="alertdialog"
              aria-labelledby="delete-profile-title"
            >
              <p
                id="delete-profile-title"
                className="text-sm font-medium text-red-900"
              >
                Ștergi profilul personalizat?
              </p>
              <p className="mt-1 text-xs text-red-800">
                Scorul revine la ponderi egale pentru toate categoriile.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteProfile(false)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium"
                >
                  Anulează
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteProfile();
                    setConfirmDeleteProfile(false);
                  }}
                  className="flex-1 rounded-lg bg-red-600 px-2 py-1.5 text-xs font-medium text-white"
                >
                  Șterge profilul
                </button>
              </div>
            </div>
          )}

          {loading && (
            <p className="py-8 text-center text-sm text-gray-500">Se încarcă…</p>
          )}
          {!loading && pins.length === 0 && (
            <p className="py-8 text-center text-sm leading-relaxed text-gray-500">
              Nu ai salvat niciun pin încă. Apasă pe hartă pentru a explora și
              salvează locații favorite.
            </p>
          )}
          {!loading &&
            pins.map((pin) => {
              const scores = parseSavedPinScores(pin.scores_json);
              const top = topCategories(scores);
              const title =
                pin.label?.trim() ||
                `Pin salvat ${formatPinDate(pin.created_at)}`;
              const overall = pin.overall_score ?? 0;

              return (
                <div
                  key={pin.id}
                  className="mb-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3"
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectPin(pin)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {title}
                        </p>
                        {pin.profile_emoji && (
                          <span
                            className="shrink-0 text-sm"
                            title={pin.profile_name ?? undefined}
                            aria-label={
                              pin.profile_name
                                ? `Salvat cu profilul ${pin.profile_name}`
                                : "Salvat cu profil personalizat"
                            }
                          >
                            {pin.profile_emoji}
                          </span>
                        )}
                      </div>
                      <span
                        className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                        style={{
                          backgroundColor: scoreToColor(overall),
                        }}
                      >
                        {overall}
                      </span>
                      {top.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {top.map((cat) => (
                            <div
                              key={cat.key}
                              className="flex items-center gap-2"
                            >
                              <span className="w-16 truncate text-[10px] text-gray-600">
                                {cat.label}
                              </span>
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${cat.score}%`,
                                    backgroundColor: cat.color,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePin(pin.id)}
                      className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Șterge pin"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-4 w-4"
                      >
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </aside>
    </>
  );
}
