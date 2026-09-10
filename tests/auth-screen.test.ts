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
import {
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "../apps/web/node_modules/@tanstack/react-router/dist/esm/index.js";
import { AuthScreen } from "../apps/web/src/features/auth/auth-screen";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(async () => ({
    error: null as null | { code: string; message: string },
  })),
  signUp: vi.fn(async () => ({ error: null })),
  reset: vi.fn(async () => ({ error: null })),
  navigate: vi.fn(async () => {}),
}));
vi.mock("../apps/web/src/lib/auth-client", () => ({
  authClient: {
    signIn: { email: mocks.signIn },
    signUp: { email: mocks.signUp },
    requestPasswordReset: mocks.reset,
  },
}));
HTMLElement.prototype.scrollIntoView ??= () => {};
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderAuth(invite?: string) {
  const router = createRouter({ routeTree: createRootRoute() });
  vi.spyOn(router, "navigate").mockImplementation(mocks.navigate);
  return render(
    h(RouterContextProvider, { router, children: h(AuthScreen, { invite }) }),
  );
}

test("la connexion valide les champs, affiche l’erreur serveur et reprend l’invitation", async () => {
  mocks.signIn.mockResolvedValueOnce({
    error: { code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid" },
  });
  const { container } = renderAuth("invitation-test");
  fireEvent.submit(container.querySelector("form")!);
  await screen.findByText("Entrez une adresse email valide.");
  expect(mocks.signIn).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Adresse email"), {
    target: { value: "test@example.test" },
  });
  fireEvent.change(screen.getByLabelText("Mot de passe"), {
    target: { value: "Password-local-2026!" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Afficher le mot de passe" }),
  );
  expect(screen.getByLabelText("Mot de passe").getAttribute("type")).toBe(
    "text",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Masquer le mot de passe" }),
  );
  expect(screen.getByLabelText("Mot de passe").getAttribute("type")).toBe(
    "password",
  );
  fireEvent.submit(container.querySelector("form")!);
  await screen.findByText("Email ou mot de passe incorrect.");
  expect(mocks.navigate).not.toHaveBeenCalled();
  fireEvent.submit(container.querySelector("form")!);
  await waitFor(() =>
    expect(mocks.navigate).toHaveBeenCalledWith({
      to: "/invite",
      search: { invitationId: "invitation-test" },
    }),
  );
});

test("la récupération conserve l’email, bloque la navigation pendant l’envoi et confirme sans révéler le compte", async () => {
  let complete!: () => void;
  mocks.reset.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = () => resolve({ error: null });
      }),
  );
  const { container } = renderAuth();
  fireEvent.change(screen.getByLabelText("Adresse email"), {
    target: { value: "test@example.test" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Mot de passe oublié ?" }),
  );
  expect(
    (screen.getByLabelText("Adresse email") as HTMLInputElement).value,
  ).toBe("test@example.test");
  expect(screen.queryByLabelText("Mot de passe")).toBeNull();
  fireEvent.submit(container.querySelector("form")!);
  fireEvent.submit(container.querySelector("form")!);
  await waitFor(() => expect(mocks.reset).toHaveBeenCalledTimes(1));
  expect(mocks.reset).toHaveBeenCalledWith({
    email: "test@example.test",
    redirectTo: "/reset-password",
  });
  expect(
    screen
      .getByRole("button", { name: "Retour à la connexion" })
      .hasAttribute("disabled"),
  ).toBe(true);
  complete();
  await screen.findByRole("status");
  expect(
    screen.getByText(/Si un compte existe pour cette adresse/),
  ).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Envoyer le lien" })).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Retour à la connexion" }),
  );
  expect(
    screen.getByRole("heading", { name: "Reprenez le fil." }),
  ).toBeTruthy();
});

test("l’inscription conserve l’email, efface le mot de passe précédent et crée l’espace", async () => {
  const { container } = renderAuth();
  fireEvent.change(screen.getByLabelText("Adresse email"), {
    target: { value: "test@example.test" },
  });
  fireEvent.change(screen.getByLabelText("Mot de passe"), {
    target: { value: "Previous-password!" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Créer un compte" }));
  expect(
    (screen.getByLabelText("Mot de passe") as HTMLInputElement).value,
  ).toBe("");
  expect(
    screen.getByLabelText("Mot de passe").getAttribute("autocomplete"),
  ).toBe("new-password");
  fireEvent.change(screen.getByLabelText("Votre nom"), {
    target: { value: "Camille" },
  });
  fireEvent.change(screen.getByLabelText("Mot de passe"), {
    target: { value: "Password-local-2026!" },
  });
  fireEvent.submit(container.querySelector("form")!);
  await waitFor(() =>
    expect(mocks.signUp).toHaveBeenCalledWith({
      email: "test@example.test",
      name: "Camille",
      password: "Password-local-2026!",
    }),
  );
  await waitFor(() =>
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/", search: {} }),
  );
});
