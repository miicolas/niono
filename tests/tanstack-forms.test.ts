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
import { z } from "zod";
import { ActionForm } from "../apps/web/src/components/action-form";
import { PasswordSettings } from "../apps/web/src/features/auth/account-settings";

const changePassword = vi.hoisted(() => vi.fn(async () => ({ error: null })));
vi.mock("../apps/web/src/lib/auth-client", () => ({
  authClient: { changePassword },
}));
HTMLElement.prototype.scrollIntoView ??= () => {};
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

test("TanStack valide avec Zod, conserve les choix shadcn et bloque les doubles soumissions", async () => {
  let complete!: () => void;
  const pending = new Promise<void>((resolve) => {
    complete = resolve;
  });
  const submit = vi.fn(() => pending);
  const { container } = render(
    h(ActionForm, {
      schema: z.object({
        name: z.string().trim().min(1, "Saisissez un nom."),
        role: z.enum(["editor", "viewer"]),
      }),
      defaultValues: { name: "", role: "editor" },
      fields: [
        { name: "name", label: "Nom" },
        {
          name: "role",
          label: "Accès",
          options: [
            { value: "editor", label: "Modification" },
            { value: "viewer", label: "Lecture" },
          ],
        },
      ],
      submitLabel: "Enregistrer",
      onSubmit: submit,
    }),
  );
  const form = container.querySelector("form")!;
  fireEvent.submit(form);
  await screen.findByText("Saisissez un nom.");
  expect(submit).not.toHaveBeenCalled();
  const input = screen.getByRole("textbox", { name: "Nom" });
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(
    document.getElementById(input.getAttribute("aria-describedby")!)
      ?.textContent,
  ).toBe("Saisissez un nom.");
  fireEvent.change(input, { target: { value: "  Nouveau projet  " } });
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Accès" }), {
    key: "ArrowDown",
  });
  fireEvent.click(await screen.findByRole("option", { name: "Lecture" }));
  fireEvent.submit(form);
  fireEvent.submit(form);
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(submit).toHaveBeenCalledWith({
    name: "Nouveau projet",
    role: "viewer",
  });
  expect(
    screen
      .getByRole("button", { name: "Enregistrement…" })
      .hasAttribute("disabled"),
  ).toBe(true);
  complete();
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Enregistrer" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
});

test("la confirmation du mot de passe est validée avant l’appel serveur", async () => {
  const { container } = render(h(PasswordSettings));
  fireEvent.change(screen.getByLabelText("Mot de passe actuel"), {
    target: { value: "AncienMotDePasse123" },
  });
  fireEvent.change(screen.getByLabelText("Nouveau mot de passe"), {
    target: { value: "NouveauMotDePasse123" },
  });
  fireEvent.change(screen.getByLabelText("Confirmer le mot de passe"), {
    target: { value: "AutreMotDePasse123" },
  });
  fireEvent.submit(container.querySelector("form")!);
  await screen.findByText("Les mots de passe ne correspondent pas.");
  expect(changePassword).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Confirmer le mot de passe"), {
    target: { value: "NouveauMotDePasse123" },
  });
  fireEvent.submit(container.querySelector("form")!);
  await waitFor(() =>
    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: "AncienMotDePasse123",
      newPassword: "NouveauMotDePasse123",
      revokeOtherSessions: true,
    }),
  );
  await waitFor(() =>
    expect(
      (screen.getByLabelText("Nouveau mot de passe") as HTMLInputElement).value,
    ).toBe(""),
  );
});
