"use client";

import { useCallback, useEffect, useState } from "react";

export interface UserLocationState {
  /** [lng, lat] */
  position: [number, number] | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useUserLocation(): UserLocationState {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Browserul nu suportă geolocația.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.longitude, pos.coords.latitude]);
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? "Permisiune locație refuzată. Activează-o în setările browserului."
            : err.message || "Nu am putut obține locația.",
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  }, [tick]);

  return { position, loading, error, refresh };
}
