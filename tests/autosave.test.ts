// @vitest-environment happy-dom
import "fake-indexeddb/auto";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { clear, get } from "idb-keyval";
import { afterEach, expect, test, vi } from "vitest";
import { useDocumentSave } from "@/features/editor/use-document-save";

const save = vi.hoisted(() => vi.fn());
vi.mock("@/orpc/client", () => ({ client: { pages: { save } } }));
const doc = (text: string) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});
afterEach(async () => {
  cleanup();
  save.mockReset();
  await clear();
});
test("une réponse ancienne ne marque pas la saisie suivante comme enregistrée", async () => {
  let release!: (value: { revision: number }) => void;
  save
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        })
    )
    .mockResolvedValueOnce({ revision: 2 });
  const hook = renderHook(() => useDocumentSave("u", "w", "p", 0));
  act(() => hook.result.current.change(doc("Première saisie")));
  let pending!: Promise<void>;
  act(() => {
    pending = hook.result.current.flush();
  });
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  act(() => hook.result.current.change(doc("Saisie plus récente")));
  expect(hook.result.current.dirty()).toBe(true);
  await act(async () => {
    release({ revision: 1 });
    await pending;
  });
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[1]![0]).toMatchObject({
    expectedRevision: 1,
    content: doc("Saisie plus récente"),
  });
  expect(hook.result.current.status).toBe("saved");
  expect(await get("digipm-draft:u:w:p")).toBeUndefined();
});
test("une erreur conserve le brouillon et réutilise le même reçu au retry", async () => {
  save
    .mockRejectedValueOnce(new Error("Connexion perdue"))
    .mockResolvedValueOnce({ revision: 1 });
  const hook = renderHook(() => useDocumentSave("u", "w", "p", 0));
  act(() => hook.result.current.change(doc("À conserver")));
  await act(() => hook.result.current.flush());
  expect(hook.result.current.status).toBe("error");
  await waitFor(async () =>
    expect(await get("digipm-draft:u:w:p")).toMatchObject({
      content: doc("À conserver"),
    })
  );
  await act(() => hook.result.current.flush());
  expect(save.mock.calls[1]![0].mutationId).toBe(
    save.mock.calls[0]![0].mutationId
  );
  expect(hook.result.current.dirty()).toBe(false);
});
test("un conflit conserve le brouillon sans réessayer automatiquement de l’écraser", async () => {
  save.mockRejectedValue({ code: "CONFLICT" });
  const hook = renderHook(() => useDocumentSave("u", "w", "p", 0));
  act(() => hook.result.current.change(doc("Brouillon en conflit")));
  await act(() => hook.result.current.flush());
  expect(hook.result.current.status).toBe("conflict");
  await act(() => hook.result.current.flush());
  expect(save).toHaveBeenCalledTimes(1);
  expect(hook.result.current.dirty()).toBe(true);
});

test("ignorer un ancien brouillon conserve une saisie plus récente", async () => {
  const { set } = await import("idb-keyval");
  await set("digipm-draft:u:w:p", {
    content: doc("Ancien"),
    revision: 0,
    time: 1,
  });
  const hook = renderHook(() => useDocumentSave("u", "w", "p", 1));
  await waitFor(() => expect(hook.result.current.draft).not.toBeNull());
  act(() => hook.result.current.change(doc("Nouveau texte")));
  await act(() => hook.result.current.ignoreRecovered());
  expect(hook.result.current.dirty()).toBe(true);
  expect(hook.result.current.draft).toBeNull();
  expect(await get("digipm-draft:u:w:p")).toMatchObject({
    content: doc("Nouveau texte"),
  });
});
