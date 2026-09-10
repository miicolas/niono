import { deferred } from "./fixtures/content-states/deferred";
// @vitest-environment happy-dom
import { createElement as h } from "react";
import { afterEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RequestError } from "../apps/web/src/components/content-state";
import { WorkspacePanels } from "../apps/web/src/features/workspace/workspace-panels";
import { useUI } from "../apps/web/src/lib/ui-store";
import type { Bootstrap } from "../apps/web/src/features/workspace/types";

const api = vi.hoisted(() => ({ search: vi.fn(), list: vi.fn() }));
vi.mock("../apps/web/src/lib/api", () => ({ client: { pages: api } }));
vi.mock("../apps/web/src/features/workspace/settings-dialog", () => ({
  SettingsDialog: () => null,
}));

const bootstrap: Bootstrap = {
  user: {
    id: "reader",
    name: "Camille",
    email: "reader@test.invalid",
    emailVerified: true,
    createdAt: new Date("2026-09-06"),
    updatedAt: new Date("2026-09-06"),
    image: null,
  },
  workspaceId: "workspace",
  workspaces: [
    { id: "workspace", name: "Atelier", icon: "📁", role: "viewer" },
  ],
};
const caches: QueryClient[] = [];
function mountPanel(panel: "search" | "trash") {
  useUI.setState({ panel });
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  caches.push(cache);
  const onNavigate = vi.fn();
  render(
    h(
      QueryClientProvider,
      { client: cache },
      h(WorkspacePanels, {
        workspaceId: "workspace",
        bootstrap,
        onNavigate,
        onRefresh: async () => {},
      }),
    ),
  );
  return { onNavigate };
}

afterEach(() => {
  cleanup();
  caches.splice(0).forEach((cache) => cache.clear());
  useUI.setState({ panel: "none" });
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

test("la recherche passe du chargement à une erreur relançable, puis ouvre le résultat", async () => {
  const pending = deferred<never>();
  api.search.mockReturnValueOnce(pending.promise).mockResolvedValueOnce([
    {
      id: "page",
      icon: "📄",
      title: "Notes de réunion",
      excerpt: "Prochaines étapes",
    },
  ]);
  const { onNavigate } = mountPanel("search");
  expect((await screen.findByRole("status")).textContent).toContain(
    "Recherche",
  );
  expect(screen.queryByText("Aucune page à afficher")).toBeNull();
  await act(async () =>
    pending.reject(new Error("SQL details must stay private")),
  );
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByText("Aucune page à afficher")).toBeNull();
  expect(screen.queryByText("SQL details must stay private")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
  fireEvent.click(
    await screen.findByRole("button", { name: /Notes de réunion/ }),
  );
  expect(onNavigate).toHaveBeenCalledWith("page");
  expect(useUI.getState().panel).toBe("none");
});

test("une recherche sans résultat peut être effacée pour retrouver les pages", async () => {
  api.search.mockImplementation(async ({ query }: { query: string }) =>
    query
      ? []
      : [
          {
            id: "page",
            icon: "📄",
            title: "Notes de réunion",
            excerpt: "Prochaines étapes",
          },
        ],
  );
  mountPanel("search");
  await screen.findByRole("button", { name: /Notes de réunion/ });
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "introuvable" },
  });
  expect(await screen.findByText("Aucune page trouvée")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Effacer la recherche" }));
  expect(document.activeElement).toBe(screen.getByRole("textbox"));
  expect(
    await screen.findByRole("button", { name: /Notes de réunion/ }),
  ).toBeTruthy();
  expect(api.search).toHaveBeenCalledWith({
    workspaceId: "workspace",
    query: "",
  });
});

test("la corbeille ne se déclare vide qu’après une réponse réussie", async () => {
  const pending = deferred<never[]>();
  api.list.mockReturnValueOnce(pending.promise);
  mountPanel("trash");
  expect((await screen.findByRole("status")).textContent).toContain(
    "corbeille",
  );
  expect(screen.queryByText("Votre corbeille est vide")).toBeNull();
  await act(async () => pending.resolve([]));
  expect(await screen.findByText("Votre corbeille est vide")).toBeTruthy();
  expect(screen.queryByRole("status")).toBeNull();
});

test("une erreur de corbeille n’annonce pas un contenu vide et permet de recharger", async () => {
  api.list
    .mockRejectedValueOnce(new Error("Network failure"))
    .mockResolvedValueOnce([
      {
        id: "deleted",
        title: "Anciennes notes",
        icon: "📄",
        deletedAt: new Date("2026-09-06"),
      },
    ]);
  mountPanel("trash");
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByText("Votre corbeille est vide")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
  expect(await screen.findByText("Anciennes notes")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("le bouton de reprise empêche les nouveaux clics pendant le chargement", () => {
  const onRetry = vi.fn();
  const onHome = vi.fn();
  const view = render(h(RequestError, { onRetry, onHome }));
  fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
  expect(onRetry).toHaveBeenCalledOnce();
  view.rerender(h(RequestError, { onRetry, onHome, retrying: true }));
  const retry = screen.getByRole("button", { name: "Chargement…" });
  expect(retry.hasAttribute("disabled")).toBe(true);
  fireEvent.click(retry);
  expect(onRetry).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole("button", { name: "Retour à l’accueil" }));
  expect(onHome).toHaveBeenCalledOnce();
});

test("une session expirée propose la connexion et une page absente garde un retour", () => {
  const view = render(
    h(RequestError, { error: { code: "UNAUTHORIZED" }, onRetry: vi.fn() }),
  );
  expect(
    screen.getByRole("link", { name: "Se connecter" }).getAttribute("href"),
  ).toBe("/login");
  expect(screen.queryByRole("button", { name: "Réessayer" })).toBeNull();
  view.rerender(
    h(RequestError, {
      error: { code: "NOT_FOUND" },
      onRetry: vi.fn(),
      onHome: vi.fn(),
    }),
  );
  expect(
    screen.getByRole("heading", { name: "Cette page est introuvable" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Retour à l’accueil" }),
  ).toBeTruthy();
});

test("la perte et le retour de connexion actualisent le message sans recharger", async () => {
  const connection = vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  render(
    h(RequestError, { title: "Impossible d’ouvrir la page", onRetry: vi.fn() }),
  );
  connection.mockReturnValue(false);
  act(() => window.dispatchEvent(new Event("offline")));
  expect(await screen.findByText("La connexion est interrompue")).toBeTruthy();
  connection.mockReturnValue(true);
  act(() => window.dispatchEvent(new Event("online")));
  await waitFor(() =>
    expect(screen.getByText("Impossible d’ouvrir la page")).toBeTruthy(),
  );
});
