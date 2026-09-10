import { type QuestionnaireSectionProps } from "@digipm/contracts/questionnaire";
import { useQuestionnaireSection } from "./use-questionnaire-section";

export type QuestionnaireProps = QuestionnaireSectionProps;

export type QuestionnaireState = ReturnType<typeof useQuestionnaireSection>;
