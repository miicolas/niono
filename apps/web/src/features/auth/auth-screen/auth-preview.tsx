import {
  Check,
  ChevronDown,
  FileText,
  Hash,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Search,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AuthPreview() {
  return (
    <div className="auth-preview" aria-hidden="true">
      <div className="auth-preview-sidebar">
        <div className="auth-preview-workspace">
          <span>É</span> Équipe produit <ChevronDown size={12} />
        </div>
        <div className="auth-preview-nav">
          <Search /> Recherche
        </div>
        <div className="auth-preview-nav">
          <LayoutGrid /> Accueil
        </div>
        <small>VOTRE ESPACE</small>
        <div className="auth-preview-nav is-active">
          <FileText /> Vue d’ensemble
        </div>
        <div className="auth-preview-nav">
          <Hash /> Projets
        </div>
        <div className="auth-preview-nav">
          <FileText /> Notes & idées
        </div>
        <div className="auth-preview-nav">
          <Plus /> Nouvelle page
        </div>
      </div>
      <div className="auth-preview-page">
        <div className="auth-preview-toolbar">
          <span>Équipe produit / Vue d’ensemble</span>
          <Star size={12} />
          <MoreHorizontal size={14} />
        </div>
        <div className="auth-preview-content">
          <span className="auth-preview-icon">✳</span>
          <h3>Une vision plus claire.</h3>
          <p>Les idées d’aujourd’hui, les projets de demain.</p>
          <div className="auth-preview-callout">
            Tout commence par une idée. Faisons-la avancer.
          </div>
          <div className="auth-preview-section">
            <span>Nos priorités</span>
            <MoreHorizontal size={14} />
          </div>
          <div className="auth-preview-task">
            <span className="auth-preview-check">
              <Check size={10} />
            </span>
            Cadrer la prochaine étape<Badge variant="secondary">Terminé</Badge>
          </div>
          <div className="auth-preview-task">
            <span className="auth-preview-check" />
            Donner forme aux idées<Badge variant="secondary">En cours</Badge>
          </div>
          <div className="auth-preview-task">
            <span className="auth-preview-check" />
            Partager les premiers retours
            <Badge variant="outline">À venir</Badge>
          </div>
          <div className="auth-preview-note">
            <FileText size={15} />
            <span>
              Le carnet de l’équipe
              <small>Une place pour chaque nouvelle idée.</small>
            </span>
            <span>↗</span>
          </div>
        </div>
      </div>
    </div>
  );
}
