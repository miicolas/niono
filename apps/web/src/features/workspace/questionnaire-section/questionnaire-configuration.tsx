import { FieldSet, FieldLegend } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { newQuestion } from "@digipm/contracts/questionnaire";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectField } from "@/components/ui/select-field";
import { SelectItem } from "@/components/ui/select";
import { type QuestionnaireState } from "./shared";

export function QuestionnaireConfiguration({
  shownMode,
  value,
  onChange,
  configure,
  ready,
  setCurrent,
  setMode,
}: Pick<
  QuestionnaireState,
  | "shownMode"
  | "value"
  | "onChange"
  | "configure"
  | "ready"
  | "setCurrent"
  | "setMode"
>) {
  return (
    shownMode === "configure" && (
      <div className="grid gap-4">
        <Label className="grid gap-1 text-sm">
          Titre du questionnaire
          <Input
            value={value.title}
            maxLength={200}
            onChange={(e) =>
              onChange({ ...value, title: e.target.value, completed: false })
            }
          />
        </Label>
        <p className="text-xs text-muted-foreground">
          Les réponses sont partagées avec la page. Modifier une question efface
          sa réponse ; Annuler dans l’éditeur permet de la retrouver.
        </p>
        {value.questions.map((question, index) => (
          <FieldSet
            key={question.id}
            className="grid min-w-0 gap-3 rounded-md border p-3"
          >
            <FieldLegend className="px-1 text-sm font-medium">
              Question {index + 1}
            </FieldLegend>
            <div className="flex items-end gap-2">
              <Label className="grid min-w-0 flex-1 gap-1 text-sm">
                Intitulé
                <Input
                  value={question.prompt}
                  maxLength={500}
                  placeholder="Que souhaitez-vous savoir ?"
                  onChange={(e) =>
                    configure(question.id, { prompt: e.target.value })
                  }
                />
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Supprimer la question ${index + 1}`}
                disabled={value.questions.length === 1}
                onClick={() =>
                  onChange({
                    ...value,
                    completed: false,
                    questions: value.questions.filter(
                      (q) => q.id !== question.id,
                    ),
                  })
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <Label className="grid gap-1 text-sm">
              Type de réponse
              <SelectField
                value={question.kind}
                aria-label={`Type de réponse de la question ${index + 1}`}
                onValueChange={(kind) => {
                  if (
                    kind === "text" ||
                    kind === "single" ||
                    kind === "multiple"
                  )
                    configure(question.id, { kind });
                }}
              >
                <SelectItem value="text">Texte libre</SelectItem>
                <SelectItem value="single">Choix unique</SelectItem>
                <SelectItem value="multiple">Choix multiples</SelectItem>
              </SelectField>
            </Label>
            {question.kind !== "text" && (
              <>
                <Label className="grid gap-1 text-sm">
                  Choix proposés (un par ligne, 20 maximum)
                  <Textarea
                    value={question.options.join("\n")}
                    rows={3}
                    onChange={(e) => {
                      const options = [
                        ...new Set(
                          e.target.value
                            .split("\n")
                            .map((o) => o.slice(0, 200)),
                        ),
                      ].slice(0, 20);
                      configure(question.id, { options });
                    }}
                  />
                </Label>
                <Label className="flex min-h-11 items-center gap-2 text-sm">
                  <Checkbox
                    checked={question.allowOther}
                    onCheckedChange={(checked) =>
                      configure(question.id, { allowOther: checked === true })
                    }
                  />
                  Autoriser une autre réponse
                </Label>
              </>
            )}
            <Label className="flex min-h-11 items-center gap-2 text-sm">
              <Checkbox
                checked={question.required}
                onCheckedChange={(checked) =>
                  configure(question.id, { required: checked === true })
                }
              />
              Réponse obligatoire
            </Label>
          </FieldSet>
        ))}
        <div className="flex flex-wrap justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={value.questions.length >= 30}
            onClick={() =>
              onChange({
                ...value,
                completed: false,
                questions: [...value.questions, newQuestion()],
              })
            }
          >
            <Plus className="size-4" />
            Ajouter une question
          </Button>
          <Button
            type="button"
            disabled={!ready}
            onClick={() => {
              setCurrent(value.questions[0]!.id);
              setMode("answer");
            }}
          >
            Ouvrir le questionnaire
          </Button>
        </div>
        {!ready && (
          <p className="text-sm text-muted-foreground">
            Renseignez un titre, chaque question et au moins deux choix
            distincts pour les questions à choix.
          </p>
        )}
      </div>
    )
  );
}
