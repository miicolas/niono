import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ClipboardList } from "lucide-react";
import { type QuestionnaireProps } from "./shared";
import { useQuestionnaireSection } from "./use-questionnaire-section";
import { QuestionnaireConfiguration } from "./questionnaire-configuration";
import { QuestionnaireAnswers } from "./questionnaire-answers";
import { QuestionnaireSummary } from "./questionnaire-summary";

export function QuestionnaireSection(props: QuestionnaireProps) {
  const {
    value,
    editable,
    shownMode,
    setMode,
    ready,
    onChange,
    configure,
    setCurrent,
    active,
    patch,
  } = useQuestionnaireSection(props);
  return (
    <section
      aria-label={value.title || "Questionnaire"}
      className="questionnaire-section not-typeset my-6 min-w-0 rounded-lg border bg-card p-4 text-sm leading-normal text-card-foreground sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 font-medium">
          <ClipboardList className="size-4 shrink-0" aria-hidden="true" />
          {value.title || "Questionnaire"}
        </div>
        {editable && (
          <ToggleGroup
            type="single"
            value={shownMode}
            onValueChange={(value) => {
              if (
                value === "configure" ||
                value === "answer" ||
                value === "summary"
              )
                setMode(value);
            }}
            spacing={1}
            className="flex flex-wrap"
            aria-label="Affichage du questionnaire"
          >
            <ToggleGroupItem value="configure">Configurer</ToggleGroupItem>
            <ToggleGroupItem value="answer" disabled={!ready}>
              Répondre
            </ToggleGroupItem>
            <ToggleGroupItem value="summary">Réponses</ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>

      <QuestionnaireConfiguration
        shownMode={shownMode}
        value={value}
        onChange={onChange}
        configure={configure}
        ready={ready}
        setCurrent={setCurrent}
        setMode={setMode}
      />

      <QuestionnaireAnswers
        shownMode={shownMode}
        ready={ready}
        value={value}
        active={active}
        setCurrent={setCurrent}
        editable={editable}
        onChange={onChange}
        setMode={setMode}
        patch={patch}
      />

      <QuestionnaireSummary shownMode={shownMode} value={value} />
    </section>
  );
}
