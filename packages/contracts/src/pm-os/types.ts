import type { PageQuestionnaire } from "../questionnaire";

export type PmSubject = {
  id: string;
  workspaceId: string;
  pageId: string;
  draftsPageId: string;
  title: string;
};
export type PmStep = {
  key: string;
  kind: string;
  label: string;
  status: "running" | "completed" | "failed";
  detail?: string;
};
export type PmWebSource = { url: string; title: string };
export type PmRun = {
  id: string;
  conversationId: string;
  subjectId: string | null;
  workflowId: string | null;
  packVersion: string;
  status: "running" | "awaiting_input" | "completed" | "interrupted" | "failed";
  steps: PmStep[];
  webSources: PmWebSource[];
};
export type PmAnswers = Record<
  string,
  { selected: string[]; text: string; skipped: boolean }
>;
export type AssistantQuestionnaire = {
  id: string;
  runId: string;
  definition: PageQuestionnaire;
  answers: PmAnswers;
  status: "pending" | "answered" | "cancelled";
  revision: number;
};
export type PmArtifact = {
  id: string;
  runId: string;
  pageId: string;
  assetId: string;
  name: string;
  format: string;
  documentRevision: number;
  title: string;
  url: string;
};
export type PmPack = {
  version: string;
  sourceRevision: string;
  importedAt: string;
  resources: Record<string, string>;
};
