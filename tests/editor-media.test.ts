// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react";
import { renderEditor } from "./fixtures/editor-media/render-editor";
import { pasteFiles } from "./fixtures/editor-media/paste-files";
import { documentSchema } from "../packages/contracts/src";

afterEach(cleanup);

test("l’image est réglable, supprimable et restaurable par annuler", async () => {
  const { editor } = await renderEditor({
    content: {
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: "https://example.com/photo.png", alt: "Photo" },
        },
        { type: "paragraph" },
      ],
    },
  });
  expect(await screen.findByAltText("Photo")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Modifier une image" }));
  fireEvent.change(await screen.findByLabelText("Légende"), {
    target: { value: "Une belle vue" },
  });
  fireEvent.change(screen.getByLabelText("Texte alternatif"), {
    target: { value: "Une montagne" },
  });
  fireEvent.change(screen.getByLabelText("Largeur en pixels"), {
    target: { value: "320" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
  await waitFor(() =>
    expect(
      documentSchema.parse(editor.getJSON()).content?.[0]?.attrs,
    ).toMatchObject({
      caption: "Une belle vue",
      alt: "Une montagne",
      width: 320,
    }),
  );
  expect(
    documentSchema.safeParse(documentSchema.parse(editor.getJSON())).success,
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Supprimer le média" }));
  await waitFor(() => expect(screen.queryByAltText("Une montagne")).toBeNull());
  act(() => {
    editor.commands.undo();
  });
  expect(await screen.findByAltText("Une montagne")).toBeTruthy();
});

test("un upload multiple garde l’ordre et suit son emplacement pendant la saisie", async () => {
  let finish:
    ((value: { url: string; name: string; mime: string }) => void) | undefined;
  const upload = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce({
      url: "https://example.com/second.pdf",
      name: "second.pdf",
      mime: "application/pdf",
    });
  const { editor, textbox } = await renderEditor({
    onUpload: upload,
    content: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Début" }] },
        { type: "paragraph", content: [{ type: "text", text: "Fin" }] },
      ],
    },
  });
  act(() => {
    editor.commands.setTextSelection(6);
  });
  pasteFiles(textbox, [
    new File(["a"], "first.png", { type: "image/png" }),
    new File(["b"], "second.pdf", { type: "application/pdf" }),
  ]);
  expect(await screen.findByText("Envoi en cours…")).toBeTruthy();
  act(() => {
    editor.commands.insertContentAt(1, "Préfixe ");
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
  });
  await act(async () =>
    finish!({
      url: "https://example.com/first.png",
      name: "first.png",
      mime: "image/png",
    }),
  );
  await waitFor(() =>
    expect(
      editor
        .getJSON()
        .content?.filter((node) => ["image", "file"].includes(node.type))
        .map((node) => node.attrs?.name),
    ).toEqual(["first.png", "second.pdf"]),
  );
  const nodes = documentSchema.parse(editor.getJSON()).content!;
  expect(nodes.findIndex((node) => node.type === "file")).toBeLessThan(
    nodes.findIndex((node) => node.content?.[0]?.text === "Fin"),
  );
  expect(nodes[0]?.content?.[0]?.text).toBe("Préfixe Début");
});

test("annuler un upload empêche toute insertion tardive", async () => {
  let finish:
    ((value: { url: string; name: string; mime: string }) => void) | undefined;
  const upload = vi.fn(
    () =>
      new Promise<{ url: string; name: string; mime: string }>((resolve) => {
        finish = resolve;
      }),
  );
  const { editor, textbox } = await renderEditor({ onUpload: upload });
  pasteFiles(textbox, [new File(["x"], "annuler.png", { type: "image/png" })]);
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Annuler l’envoi de annuler.png",
    }),
  );
  await act(async () =>
    finish!({
      url: "https://example.com/late.png",
      name: "late.png",
      mime: "image/png",
    }),
  );
  expect(
    documentSchema
      .parse(editor.getJSON())
      .content?.some((node) => node.type === "image"),
  ).toBe(false);
});

test("un échec d’upload est relançable et la lecture seule bloque les envois", async () => {
  const upload = vi
    .fn()
    .mockRejectedValueOnce(new Error("Réseau interrompu"))
    .mockResolvedValue({
      url: "https://example.com/doc.pdf",
      name: "doc.pdf",
      mime: "application/pdf",
    });
  const { editor, textbox, rerenderProps } = await renderEditor({
    onUpload: upload,
  });
  pasteFiles(textbox, [
    new File(["x"], "doc.pdf", { type: "application/pdf" }),
  ]);
  expect(await screen.findByText("Réseau interrompu")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
  await waitFor(() =>
    expect(
      documentSchema
        .parse(editor.getJSON())
        .content?.some((node) => node.type === "file"),
    ).toBe(true),
  );
  rerenderProps({ editable: false });
  expect(
    screen.queryByRole("button", { name: "Supprimer le média" }),
  ).toBeNull();
  pasteFiles(textbox, [new File(["x"], "interdit.pdf")]);
  expect(upload).toHaveBeenCalledTimes(2);
});

test("remplacer depuis le champ fichier conserve les réglages et reste annulable", async () => {
  const upload = vi
    .fn()
    .mockRejectedValueOnce(new Error("Connexion interrompue"))
    .mockResolvedValue({
      url: "https://example.com/new.png",
      name: "nouvelle.png",
      mime: "image/png",
    });
  const { editor } = await renderEditor({
    onUpload: upload,
    content: {
      type: "doc",
      content: [
        {
          type: "image",
          attrs: {
            src: "https://example.com/old.png",
            alt: "Paysage",
            caption: "Légende conservée",
            width: 320,
          },
        },
        { type: "paragraph" },
      ],
    },
  });
  fireEvent.click(
    await screen.findByRole("button", { name: "Modifier une image" }),
  );
  const input = await screen.findByLabelText("Choisir un fichier");
  const file = new File(["image"], "nouvelle.png", { type: "image/png" });
  fireEvent.change(input, { target: { files: [file] } });
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Connexion interrompue",
  );
  expect(documentSchema.parse(editor.getJSON()).content?.[0]?.attrs?.src).toBe(
    "https://example.com/old.png",
  );
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() =>
    expect(
      documentSchema.parse(editor.getJSON()).content?.[0]?.attrs,
    ).toMatchObject({
      src: "https://example.com/new.png",
      caption: "Légende conservée",
      width: 320,
      alt: "Paysage",
    }),
  );
  act(() => {
    editor.commands.undo();
  });
  expect(documentSchema.parse(editor.getJSON()).content?.[0]?.attrs?.src).toBe(
    "https://example.com/old.png",
  );
});
