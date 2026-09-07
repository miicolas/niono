import { FileText, Layers, MoveUpRight } from "lucide-react";
import { PROJECT } from "@/constants/project";

/** Panneau éditorial affiché à gauche des écrans de connexion. */
export function AuthStory() {
  return (
    <aside className="auth-story">
      <a className="brand" href="/">
        <span className="brand-mark">{PROJECT.MARK}</span>
        {PROJECT.NAME}
      </a>
      <div className="auth-story-content">
        <span className="eyebrow">DE L’ESPACE POUR L’ESSENTIEL</span>
        <h1>
          Les idées prennent
          <br />
          vie ici<span>.</span>
        </h1>
        <p>
          Vos notes, vos projets, votre prochain grand pas.
          <br />
          Un espace qui vous ressemble.
        </p>
        <div className="auth-paper">
          <div>
            <FileText size={18} />
            <span>Une idée pour commencer</span>
            <MoveUpRight size={14} />
          </div>
          <h3>
            Tout commence
            <br />
            par une page blanche.
          </h3>
          <div className="paper-lines">
            <i />
            <i />
            <i />
          </div>
          <span className="paper-note">Faites de la place à vos idées.</span>
        </div>
      </div>
      <footer>
        <Layers size={14} /> Votre espace. Vos données.
      </footer>
    </aside>
  );
}
