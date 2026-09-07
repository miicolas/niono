import { Sparkles, X } from "lucide-react";
import { AIRewriteForm } from "./ai-rewrite-form";
import type { AIRewrite } from "./use-ai-rewrite";

export type AIPanelProps = {
  available?: boolean;
  rewrite: AIRewrite;
};

/** Panneau de l'assistant d'écriture, ouvert sur une sélection de texte. */
export function AIPanel({ available, rewrite }: AIPanelProps) {
  if (!rewrite.state) {
    return null;
  }
  return (
    <div aria-label="Assistant d’écriture" className="ai-panel" role="dialog">
      <div className="ai-panel-header">
        <Sparkles size={16} />
        <strong>Un coup de pouce pour vos idées</strong>
        <button
          aria-label="Fermer l’assistant"
          onClick={rewrite.close}
          type="button"
        >
          <X size={16} />
        </button>
      </div>
      {available ? (
        <AIRewriteForm rewrite={rewrite} state={rewrite.state} />
      ) : (
        <p>
          Pour activer l’assistant, configurez un fournisseur IA dans les
          paramètres du serveur. Votre texte reste sur votre appareil tant que
          vous ne lancez pas une demande.
        </p>
      )}
    </div>
  );
}
