import { OpenAILogo } from "@/components/openai-logo";
import { FileText, PenLine, ListChecks, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type CodexPanelState } from "./codex-panel-state";

export function CodexWelcome({
  id,
  codex,
  pageId,
  busy,
  fillPrompt,
}: Pick<CodexPanelState, "id" | "codex" | "pageId" | "busy" | "fillPrompt">) {
  return (
    !id && (
      <div className="codex-welcome">
        <div className="codex-welcome-mark">
          <OpenAILogo width={44} height={44} />
        </div>
        <h2>
          {codex.selection
            ? "Le bon mot.\nLa bonne idée."
            : "On fait avancer\nvos idées ?"}
        </h2>
        <p>
          {codex.selection
            ? "Un passage à affiner ? Choisissez une direction, puis ajustez votre demande."
            : "Un premier jet, une idée à clarifier, une réponse dans vos pages. On commence où ?"}
        </p>
        <div className="codex-suggestions" aria-label="Suggestions de demandes">
          {(codex.selection
            ? [
                {
                  icon: PenLine,
                  title: "Améliorer ce passage",
                  detail: "Plus clair, sans changer votre intention",
                  prompt:
                    "Améliore la clarté de cette sélection en conservant mon intention et mon ton.",
                },
                {
                  icon: FileText,
                  title: "Garder l’essentiel",
                  detail: "Une version courte et précise",
                  prompt:
                    "Résume cette sélection en conservant les informations essentielles.",
                },
                {
                  icon: ListChecks,
                  title: "En faire un plan d’action",
                  detail: "Des prochaines étapes concrètes",
                  prompt:
                    "Transforme cette sélection en une liste d’actions concrètes.",
                },
              ]
            : [
                {
                  icon: PenLine,
                  title: "Écrire un premier jet",
                  detail: "Donner forme à une idée",
                  prompt: "Aide-moi à rédiger un premier jet sur ",
                },
                {
                  icon: FileText,
                  title: pageId ? "Résumer cette page" : "Explorer mon espace",
                  detail: pageId
                    ? "Les points clés, en quelques lignes"
                    : "Retrouver les informations utiles",
                  prompt: pageId
                    ? "Résume cette page en quelques points clés."
                    : "Trouve dans cet espace les pages qui parlent de ",
                },
                {
                  icon: ListChecks,
                  title: "Préparer un plan d’action",
                  detail: "Passer de l’idée aux prochaines étapes",
                  prompt: "Aide-moi à préparer un plan d’action pour ",
                },
              ]
          ).map(({ icon: Icon, title, detail, prompt: suggestion }) => (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              key={title}
              disabled={busy}
              onClick={() => fillPrompt(suggestion)}
            >
              <span className="codex-suggestion-icon">
                <Icon size={18} />
              </span>
              <span>
                <strong>{title}</strong>
                <small>{detail}</small>
              </span>
              <ArrowUpRight size={15} className="codex-suggestion-arrow" />
            </Button>
          ))}
        </div>
      </div>
    )
  );
}
