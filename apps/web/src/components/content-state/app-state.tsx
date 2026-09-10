import { type ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";

export function AppState({ children }: { children: ReactNode }) {
  return (
    <div className="app-state">
      <header className="app-state-brand">
        <BrandLogo decorative />
        <span>DigiPM</span>
      </header>
      <main className="app-state-main">{children}</main>
    </div>
  );
}
