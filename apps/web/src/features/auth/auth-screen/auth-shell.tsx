import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { AuthPreview } from "./auth-preview";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <section className="auth-entry">
        <header className="auth-header">
          <a className="brand" href="/" aria-label="DigiPM — Accueil">
            <BrandLogo decorative />
            DigiPM
          </a>
          <span>Votre espace de travail</span>
        </header>
        <main className="auth-form-side">{children}</main>
        <footer className="auth-footer">
          <span>Un peu de clarté. Beaucoup de possibilités.</span>
          <span>DigiPM</span>
        </footer>
      </section>
      <aside className="auth-story" aria-label="Découvrez votre espace DigiPM">
        <div className="auth-story-heading">
          <span className="auth-eyebrow">
            LES BONNES IDÉES MÉRITENT UNE PLACE
          </span>
          <h2>
            Moins de dispersion.
            <br />
            <em>Plus de perspective.</em>
          </h2>
          <p>Vos notes, vos projets et votre équipe. Enfin au même endroit.</p>
        </div>
        <AuthPreview />
        <div className="auth-story-caption">
          <span>Une page pour réfléchir. Un espace pour avancer.</span>
          <span aria-hidden="true">↗</span>
        </div>
      </aside>
    </div>
  );
}
