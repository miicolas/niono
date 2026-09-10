import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { documentText } from "@digipm/contracts";
import { type Proposal } from "../codex-context";

export function ProposalCard({
  proposal,
  busy,
  onDecide,
}: {
  proposal: Proposal;
  busy: boolean;
  onDecide: (
    proposal: Proposal,
    decision: "apply" | "reject",
    mode?: "replace" | "insert",
  ) => Promise<void>;
}) {
  const action = proposal.action;
  const after =
    "content" in action
      ? documentText(action.content)
      : action.type === "selection"
        ? action.text
        : action.type === "renamePage"
          ? action.title
          : action.type === "rememberPage"
            ? "Réutiliser cette page comme référence " +
              (action.subjectId ? "du sujet" : "de l’entreprise") +
              " (" +
              action.role +
              ")."
            : JSON.stringify(action.value);
  return (
    <article className="codex-proposal">
      <strong>{proposal.summary}</strong>
      <Collapsible defaultOpen>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="codex-proposal-toggle">
            <ChevronDown size={14} /> Aperçu des modifications
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="codex-before">
            <span>Avant</span>
            <pre>{proposal.before}</pre>
          </div>
          <div className="codex-after">
            <span>Après{"title" in action ? ` · ${action.title}` : ""}</span>
            <pre>{after}</pre>
          </div>
        </CollapsibleContent>
      </Collapsible>
      {proposal.status === "pending" ? (
        <div className="codex-proposal-actions">
          <Button
            disabled={busy}
            onClick={() => void onDecide(proposal, "apply")}
          >
            {action.type === "selection"
              ? "Remplacer la sélection"
              : "Appliquer"}
          </Button>
          {action.type === "selection" && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void onDecide(proposal, "apply", "insert")}
            >
              Insérer après
            </Button>
          )}
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => void onDecide(proposal, "reject")}
          >
            Refuser
          </Button>
        </div>
      ) : (
        <p className="flex items-center gap-1 text-sm">
          <Check size={14} />
          {proposal.status === "applied"
            ? "Modification appliquée"
            : "Proposition refusée"}
        </p>
      )}
    </article>
  );
}
