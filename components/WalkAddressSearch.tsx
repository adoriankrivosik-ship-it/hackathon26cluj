"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { searchAddresses, type GeocodeFeature } from "@/lib/mapbox-geocode";

interface WalkAddressSearchProps {
  mapboxToken: string;
  onSelect: (lng: number, lat: number, label: string) => void;
}

export function WalkAddressSearch({
  mapboxToken,
  onSelect,
}: WalkAddressSearchProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      void searchAddresses(trimmed, mapboxToken, controller.signal)
        .then((features) => {
          setSuggestions(features);
          setOpen(true);
          setActiveIndex(features.length > 0 ? 0 : -1);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setSuggestions([]);
          setError(
            err instanceof Error ? err.message : "Căutarea a eșuat.",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, mapboxToken]);

  const pickSuggestion = useCallback(
    (feature: GeocodeFeature) => {
      const [lng, lat] = feature.center;
      setQuery(feature.place_name);
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      onSelect(lng, lat, feature.place_name);
    },
    [onSelect],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        i <= 0 ? suggestions.length - 1 : i - 1,
      );
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[activeIndex]!);
    }
  };

  const showDropdown =
    open && (loading || error !== null || suggestions.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Caută adresă în Cluj-Napoca
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        >
          🔍
        </span>
        <input
          ref={inputRef}
          id={`${listId}-input`}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Caută adresă în Cluj-Napoca…"
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={`${listId}-listbox`}
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined
          }
          className="w-full min-h-[44px] rounded-xl border border-gray-200 bg-white/95 py-2.5 pl-10 pr-10 text-sm text-gray-900 shadow-md ring-1 ring-gray-200/80 backdrop-blur-sm placeholder:text-gray-400 focus:border-[#F0A500] focus:outline-none focus:ring-2 focus:ring-[#F0A500]/40"
        />
        {loading && (
          <span
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[#F0A500] border-t-transparent"
            role="status"
            aria-label="Se caută"
          />
        )}
        {!loading && query.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Șterge căutarea"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          id={`${listId}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-gray-200/80"
        >
          {loading && suggestions.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-gray-500">Se caută…</li>
          )}
          {error && (
            <li className="px-3 py-2.5 text-sm text-red-600" role="alert">
              {error}
            </li>
          )}
          {!loading &&
            !error &&
            suggestions.length === 0 &&
            query.trim().length >= 2 && (
              <li className="px-3 py-2.5 text-sm text-gray-500">
                Nicio adresă găsită.
              </li>
            )}
          {suggestions.map((feature, index) => (
            <li key={feature.id} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                id={`${listId}-opt-${index}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => pickSuggestion(feature)}
                className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${
                  index === activeIndex
                    ? "bg-[#F0A500]/15 text-[#0D1B2A]"
                    : "text-gray-800 hover:bg-gray-50"
                }`}
              >
                <span className="font-medium">{feature.text}</span>
                <span className="mt-0.5 block truncate text-xs text-gray-500">
                  {feature.place_name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
