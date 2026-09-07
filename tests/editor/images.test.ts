import "../support/happy-dom";
import { expect, test } from "bun:test";
import { toImageAlign } from "@/lib/editor/image-align";
import { clampImageWidth } from "@/lib/editor/image-width";
import { pasteFiles } from "@/lib/editor/paste-files";
import { transferFiles } from "@/lib/editor/transfer-files";
import { validateDocument } from "@/lib/editor/validate-document";

const png = (name = "capture.png") =>
  new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], name, {
    type: "image/png",
  });

const imageDoc = (attrs: Record<string, unknown>) => ({
  type: "doc",
  content: [{ type: "image", attrs: { src: "/api/assets/x", ...attrs } }],
});

/** DataTransfer minimal : happy-dom n'expose pas encore le vrai constructeur. */
function transfer(files: File[], data: Record<string, string> = {}) {
  return {
    files,
    items: files.map((file) => ({ kind: "file", getAsFile: () => file })),
    types: [...Object.keys(data), ...(files.length ? ["Files"] : [])],
    getData: (type: string) => data[type] ?? "",
  } as unknown as DataTransfer;
}

test("une image redimensionnée et alignée reste un document valide", () => {
  expect(validateDocument(imageDoc({ width: 45, align: "left" }))).toBe(true);
  expect(validateDocument(imageDoc({ width: null, align: "center" }))).toBe(
    true
  );
  expect(validateDocument(imageDoc({ alt: "Une photo du jardin" }))).toBe(true);
});

test("une mise en forme d’image hors limites est refusée", () => {
  expect(validateDocument(imageDoc({ width: 0 }))).toBe(false);
  expect(validateDocument(imageDoc({ width: 260 }))).toBe(false);
  expect(validateDocument(imageDoc({ width: "60px; background:red" }))).toBe(
    false
  );
  expect(validateDocument(imageDoc({ align: "justify" }))).toBe(false);
  expect(validateDocument(imageDoc({ alt: "a".repeat(301) }))).toBe(false);
  expect(validateDocument(imageDoc({ src: "javascript:alert(1)" }))).toBe(
    false
  );
});

test("une largeur libre est ramenée entre 10 et 100 %", () => {
  expect(clampImageWidth(-40)).toBe(10);
  expect(clampImageWidth(1000)).toBe(100);
  expect(clampImageWidth(42.4)).toBe(42);
});

test("un alignement inconnu retombe sur le centre", () => {
  expect(toImageAlign("right")).toBe("right");
  expect(toImageAlign("justify")).toBe("center");
  expect(toImageAlign(undefined)).toBe("center");
});

test("un collage de fichiers est importé, plusieurs à la fois", () => {
  const files = [png("une.png"), png("deux.png")];
  expect(pasteFiles(transfer(files)).map((f) => f.name)).toEqual([
    "une.png",
    "deux.png",
  ]);
});

test("un collage qui porte aussi du texte garde le collage habituel", () => {
  const clipboard = transfer([png()], {
    "text/plain": "Janvier\tFévrier",
    "text/html": "<table><tr><td>Janvier</td></tr></table>",
  });
  expect(pasteFiles(clipboard)).toEqual([]);
});

test("un glisser-déposer sans liste de fichiers lit les éléments", () => {
  const dropped = png("depose.png");
  const data = {
    files: [] as File[],
    items: [{ kind: "file", getAsFile: () => dropped }],
    types: ["Files"],
    getData: () => "",
  } as unknown as DataTransfer;
  expect(transferFiles(data)).toEqual([dropped]);
  expect(transferFiles(null)).toEqual([]);
});
