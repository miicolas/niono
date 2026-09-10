// @vitest-environment happy-dom
import { createElement as h } from "react";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MessageText } from "../apps/web/src/features/codex/message-text";
afterEach(cleanup);
test("les réponses structurées restent lisibles sans exécuter de HTML ni charger d’images distantes", () => {
  render(
    h(MessageText, {
      workspaceId: "workspace",
      sources: [{ pageId: "page" }],
      text: "### Priorités\n1. **Préparer** le lancement\n2. Relire le [Plan](/?w=workspace&p=page)\n\n<script>unsafe()</script>\n\n![pixel](https://example.invalid/track)\n\n[Piège](javascript:alert(1))\n\n[Autre page](/?w=workspace&p=private)\n\n`const ok = true`",
    }),
  );
  expect(screen.getByRole("heading", { name: "Priorités" })).toBeTruthy();
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(screen.getByRole("link", { name: "Plan" }).getAttribute("href")).toBe(
    "/?w=workspace&p=page",
  );
  expect(document.querySelector("script, img")).toBeNull();
  expect(screen.getByText("const ok = true").tagName).toBe("CODE");
});
