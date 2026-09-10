import { createElement as h } from "react";
import { useCodex } from "../../../apps/web/src/features/codex/codex-context";

export function Open() {
  const context = useCodex();
  return h(
    "button",
    { onClick: () => context.setOpen(true) },
    "Ouvrir le test",
  );
}
