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
import { documentSchema } from "../packages/contracts/src";
import type { MentionItem } from "../packages/editor/src/mentions/mention-types";

afterEach(cleanup);

test("une URL collée devient un signet conservé dans le document", async () => {
  const { editor, textbox } = await renderEditor();
  fireEvent.paste(textbox, {
    clipboardData: { files: [], getData: () => "https://example.com/article" },
  });
  fireEvent.click(
    await screen.findByRole("button", { name: "Créer un signet" }),
  );
  await waitFor(() =>
    expect(
      editor
        .getJSON()
        .content?.some(
          (node) =>
            node.type === "bookmark" &&
            node.attrs?.href === "https://example.com/article",
        ),
    ).toBe(true),
  );
  expect(
    documentSchema.safeParse(documentSchema.parse(editor.getJSON())).success,
  ).toBe(true);
});

test("coller sur du texte le transforme en lien sans perdre son libellé", async () => {
  const { editor, textbox } = await renderEditor({
    content: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Un article" }] },
      ],
    },
  });
  act(() => {
    editor.commands.setTextSelection({ from: 1, to: 11 });
  });
  fireEvent.paste(textbox, {
    clipboardData: { files: [], getData: () => "https://example.com" },
  });
  expect(
    documentSchema.parse(editor.getJSON()).content?.[0]?.content?.[0],
  ).toMatchObject({
    text: "Un article",
    marks: [
      {
        type: "link",
        attrs: expect.objectContaining({ href: "https://example.com" }),
      },
    ],
  });
  expect(screen.queryByRole("button", { name: "Créer un signet" })).toBeNull();
});

test("les suggestions @ insèrent une mention au clavier et [[ limite aux pages", async () => {
  const search = vi.fn(async (): Promise<MentionItem[]> => [
    {
      kind: "page",
      referenceId: "page-1",
      workspaceId: "workspace-1",
      label: "Feuille de route",
    },
  ]);
  const { editor, textbox } = await renderEditor({ onMentionSearch: search });
  act(() => {
    editor.commands.insertContent("@Feuille");
  });
  expect(await screen.findByText("Feuille de route")).toBeTruthy();
  fireEvent.keyDown(textbox, { key: "Enter" });
  await waitFor(() =>
    expect(
      documentSchema.parse(editor.getJSON()).content?.[0]?.content?.[0],
    ).toMatchObject({
      type: "mention",
      attrs: { kind: "page", referenceId: "page-1", label: "Feuille de route" },
    }),
  );
  expect(
    documentSchema.safeParse(documentSchema.parse(editor.getJSON())).success,
  ).toBe(true);
  act(() => {
    editor.commands.insertContent(" [[Feuille");
  });
  await waitFor(() => expect(search).toHaveBeenLastCalledWith("Feuille", true));
  fireEvent.keyDown(textbox, { key: "Escape" });
  expect(
    screen.queryByRole("listbox", { name: "Suggestions de mentions" }),
  ).toBeNull();
});

test("les anciennes recherches ne remplacent pas les suggestions récentes", async () => {
  let older: ((items: MentionItem[]) => void) | undefined;
  const search = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          older = resolve;
        }),
    )
    .mockResolvedValue([
      { kind: "person", referenceId: "id", workspaceId: "w", label: "Alice" },
    ]);
  const { editor } = await renderEditor({ onMentionSearch: search });
  act(() => {
    editor.commands.insertContent("@A");
  });
  await waitFor(() => expect(search).toHaveBeenCalledTimes(1));
  act(() => {
    editor.commands.insertContent("li");
  });
  expect(await screen.findByText("Alice")).toBeTruthy();
  await act(async () =>
    older!([
      { kind: "person", referenceId: "old", workspaceId: "w", label: "Ancien" },
    ]),
  );
  expect(screen.queryByText("Ancien")).toBeNull();
  expect(screen.getByText("Alice")).toBeTruthy();
});

test("les dates restent utilisables sans serveur et une erreur de recherche est visible", async () => {
  const { editor, textbox } = await renderEditor({
    onMentionSearch: async () => {
      throw new Error("hors réseau");
    },
  });
  act(() => {
    editor.commands.insertContent("@Demain");
  });
  expect(await screen.findByText(/Demain ·/)).toBeTruthy();
  fireEvent.keyDown(textbox, { key: "Enter" });
  await waitFor(() =>
    expect(
      documentSchema.parse(editor.getJSON()).content?.[0]?.content?.[0]?.attrs
        ?.kind,
    ).toBe("date"),
  );
  act(() => {
    editor.commands.insertContent(" @Personne");
  });
  expect(await screen.findByText(/Recherche indisponible/)).toBeTruthy();
});
