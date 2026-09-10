import { type PageQuestion } from "./shared";

export function newQuestion(): PageQuestion {
  return {
    id: crypto.randomUUID(),
    prompt: "",
    kind: "text",
    required: true,
    options: [],
    allowOther: false,
    selected: [],
    text: "",
    skipped: false,
  };
}
