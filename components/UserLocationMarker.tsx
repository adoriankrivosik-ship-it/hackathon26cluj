interface UserLocationMarkerProps {
  /** Whether geolocation is still resolving */
  loading?: boolean;
}

/** Pin for the user's current position (distinct from project pins). */
export function UserLocationMarker({ loading = false }: UserLocationMarkerProps) {
  return (
    <div
      className="relative flex h-10 w-10 items-center justify-center"
      aria-label={loading ? "Se detectează locația…" : "Locația ta curentă"}
    >
      {!loading && (
        <span
          className="absolute h-8 w-8 animate-ping rounded-full bg-sky-400/40"
          aria-hidden="true"
        />
      )}
      <span
        className={`relative h-4 w-4 rounded-full border-[3px] border-white shadow-md ${
          loading ? "bg-sky-300" : "bg-sky-500"
        }`}
        aria-hidden="true"
      />
    </div>
  );
}
