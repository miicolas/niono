import { createContext } from "react";
import type { CodexSelection } from "@digipm/contracts/codex";
import type { client } from "@/lib/api";

export type Proposal = NonNullable<
  Awaited<ReturnType<typeof client.codex.events>>["proposals"]
>[number];

export type EditorBridge = {
  pageId: string;
  prepare: () => Promise<number>;
  apply: (
    proposal: Proposal,
    mode: "replace" | "insert",
    commit: () => Promise<unknown>,
  ) => Promise<void>;
};

export type Selection = CodexSelection & { pageId: string };

export type Context = {
  open: boolean;
  setOpen: (open: boolean) => void;
  selection: Selection | null;
  setSelection: (selection: Selection | null) => void;
  register: (bridge: EditorBridge) => () => void;
  editor: React.MutableRefObject<EditorBridge | null>;
  askSelection: (selection: Omit<Selection, "revision">) => Promise<void>;
};

export const CodexContext = createContext<Context | null>(null);
