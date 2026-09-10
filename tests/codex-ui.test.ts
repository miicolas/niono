import { Open } from "./fixtures/codex-ui/open";
import { snapshot } from "./fixtures/codex-ui/snapshot";
// @vitest-environment happy-dom
import { createElement as h } from "react";
import { afterEach, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CodexProvider } from "../apps/web/src/features/codex/codex-context";
import { CodexPanel } from "../apps/web/src/features/codex/codex-panel";

const api = vi.hoisted(() => ({
  status: vi.fn(async () => ({
    status: "connected",
    email: "owner@test.invalid",
    error: null,
    login: null,
  })),
  list: vi.fn(async () => [
    { id: "conversation", title: "Résumé", status: "completed" },
  ]),
  events: vi.fn(),
  send: vi.fn(),
  decide: vi.fn(async () => ({})),
  interrupt: vi.fn(),
  remove: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
}));
vi.mock("../apps/web/src/lib/api", () => ({ client: { codex: api } }));
HTMLElement.prototype.scrollIntoView ??= () => {};
const workspaceId = "workspace";

function mount() {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    h(
      QueryClientProvider,
      { client: cache },
      h(
        CodexProvider,
        null,
        h(Open),
        h(CodexPanel, { workspaceId, pageId: null, userId: "user" }),
      ),
    ),
  );
}
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

test("l’historique expose les sources et l’aperçu sans appliquer automatiquement", async () => {
  api.events.mockResolvedValue(snapshot());
  mount();
  fireEvent.click(screen.getByText("Ouvrir le test"));
  const history = await screen.findByLabelText("Conversation Codex");
  fireEvent.keyDown(history, { key: "ArrowDown" });
  fireEvent.click(await screen.findByRole("option", { name: "Résumé" }));
  expect(await screen.findByText("Ancien titre")).toBeTruthy();
  expect(screen.getByText("Nouveau titre")).toBeTruthy();
  expect(
    screen.getAllByRole("link", { name: "Plan" })[0]!.getAttribute("href"),
  ).toBe("/?w=workspace&p=page");
  expect(document.querySelector(".codex-message script")).toBeNull();
  expect(api.decide).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /^Appliquer$/ }));
  await waitFor(() =>
    expect(api.decide).toHaveBeenCalledWith({
      conversationId: "conversation",
      proposalId: "proposal",
      decision: "apply",
      mode: "replace",
    }),
  );
});
test("le panneau efface le contenu affiché si l’accès aux sources est perdu", async () => {
  api.events.mockRejectedValue(new Error("Page introuvable ou inaccessible."));
  mount();
  fireEvent.click(screen.getByText("Ouvrir le test"));
  fireEvent.keyDown(await screen.findByLabelText("Conversation Codex"), {
    key: "ArrowDown",
  });
  fireEvent.click(await screen.findByRole("option", { name: "Résumé" }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByText("Ancien titre")).toBeNull();
  expect(
    screen
      .getByRole("button", { name: "Envoyer à Codex" })
      .hasAttribute("disabled"),
  ).toBe(true);
});

test("une suggestion prépare un brouillon, puis Entrée envoie une seule demande", async () => {
  let finish: (value: { conversationId: string }) => void = () => {};
  api.send.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  api.events.mockResolvedValue(snapshot());
  mount();
  fireEvent.click(screen.getByText("Ouvrir le test"));
  fireEvent.click(
    await screen.findByRole("button", { name: /Écrire un premier jet/ }),
  );
  const input = screen.getByRole("textbox", { name: "Message à Codex" });
  expect(document.activeElement).toBe(input);
  expect((input as HTMLTextAreaElement).value).toBe(
    "Aide-moi à rédiger un premier jet sur ",
  );
  expect(api.send).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: "Préparer mon lancement" } });
  fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
  fireEvent.keyDown(input, { key: "Enter", isComposing: true });
  expect(api.send).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: "Enter" });
  fireEvent.keyDown(input, { key: "Enter" });
  await waitFor(() => expect(api.send).toHaveBeenCalledTimes(1));
  expect(api.send).toHaveBeenCalledWith(
    expect.objectContaining({ workspaceId, prompt: "Préparer mon lancement" }),
  );
  finish({ conversationId: "conversation" });
  await waitFor(() => expect((input as HTMLTextAreaElement).value).toBe(""));
});

test("un échec conserve le brouillon pour réessayer", async () => {
  api.send.mockRejectedValueOnce(new Error("Connexion interrompue"));
  mount();
  fireEvent.click(screen.getByText("Ouvrir le test"));
  const input = await screen.findByRole("textbox", { name: "Message à Codex" });
  fireEvent.change(input, { target: { value: "Mon brouillon" } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer à Codex" }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect((input as HTMLTextAreaElement).value).toBe("Mon brouillon");
  fireEvent.click(
    screen.getByRole("button", { name: "Nouvelle conversation" }),
  );
  expect((input as HTMLTextAreaElement).value).toBe("");
});
