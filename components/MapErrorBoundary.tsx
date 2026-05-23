"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Map load error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen items-center justify-center bg-surface px-6">
          <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <h1 className="text-lg font-semibold text-red-900">
              Harta nu s-a putut încărca
            </h1>
            <p className="mt-2 text-sm text-red-800">
              Repornește serverul de dezvoltare (
              <code className="rounded bg-red-100 px-1">npm run dev</code>
              ), apoi reîncarcă pagina. Dacă problema persistă, verifică tokenul
              Mapbox din <code className="rounded bg-red-100 px-1">.env.local</code>.
            </p>
            <p className="mt-3 text-xs text-red-700/80">
              {this.state.error.message}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
