import { type ComponentType, type ComponentProps, type ReactNode } from "react";
import { type Editor } from "@tiptap/react";
import { Text } from "lucide-react";
import { type QuestionnaireSectionProps } from "@digipm/contracts/questionnaire";
import type { DocumentNode } from "@digipm/contracts";
import { useDocumentEditor } from "./use-document-editor";

export const ASSISTANT_HOTKEY = "Mod+J";

export type EditorMenuAction =
  "assistant" | "bold" | "italic" | "duplicate" | "delete" | "up" | "down";

export type BlockMenuState = {
  x: number;
  y: number;
  hasSelection: boolean;
};

export type SlashMenuState = {
  query: string;
  from: number;
  to: number;
  x: number;
  y: number;
};

export type AssistantState = {
  text: string;
  from: number;
  to: number;
  instruction: string;
  result: string;
  busy: boolean;
};

export type DocumentEditorProps = {
  ui: import("./editor-ui").EditorUI;
  AssistantDialog: ComponentType<{
    children: ReactNode;
    onClose: () => void;
    onRestoreFocus: () => void;
  }>;
  QuestionnaireSection?: ComponentType<QuestionnaireSectionProps>;
  Input: ComponentType<ComponentProps<"input">>;
  Checkbox: ComponentType<{
    checked: boolean;
    disabled: boolean;
    "aria-label": string;
    onCheckedChange: (checked: boolean | "indeterminate") => void;
  }>;
  content: DocumentNode;
  collaboration?: {
    document: import("yjs").Doc;
    awareness: import("y-protocols/awareness").Awareness;
    user: { id: string; name: string };
  };
  editable: boolean;
  onChange: (doc: DocumentNode) => void;
  onReady?: (editor: Editor) => void;
  onMentionSearch?: import("../mentions/mention-types").MentionSearch;
  onUpload: import("../media/media-types").UploadHandler;
  codexIcon?: ReactNode;
  onCodex?: (selection: { from: number; to: number; text: string }) => void;
  onAI?: (text: string, instruction: string) => Promise<string>;
  aiAvailable?: boolean;
  onError?: (message: string) => void;
  onHeadings?: (
    headings: { id: string; text: string; level: number }[],
  ) => void;
};

export type Action = {
  id: string;
  label: string;
  description: string;
  icon: typeof Text;
  run: (e: Editor) => void;
};

export type EditorController = Omit<
  ReturnType<typeof useDocumentEditor>,
  "editor"
> & { editor: Editor };
