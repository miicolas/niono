import { expect, test } from "vitest";
import {
  documentSchema,
  documentText,
  type DocumentNode,
} from "../packages/contracts/src";
import { canonicalDocument } from "../packages/editor/src/document-transform";
import { CollaborativeDocument } from "../packages/editor/src/collaboration";

const content: DocumentNode = {
  type: "doc",
  content: [
    {
      type: "image",
      attrs: {
        src: "https://example.com/a.png",
        caption: "Vue",
        alt: "Montagne",
        width: 320,
        alignment: "right",
      },
    },
    {
      type: "file",
      attrs: {
        href: "/api/assets/123",
        name: "Guide.pdf",
        caption: "Lecture",
        size: 300,
      },
    },
    {
      type: "bookmark",
      attrs: {
        href: "https://example.com",
        title: "Référence",
        description: "À lire",
      },
    },
    {
      type: "paragraph",
      content: [
        {
          type: "mention",
          attrs: {
            kind: "page",
            referenceId: "p",
            workspaceId: "w",
            label: "Projet",
          },
        },
      ],
    },
  ],
};

test("les nouveaux attributs survivent à la normalisation et au cycle collaboratif", () => {
  const canonical = canonicalDocument(content);
  const first = new CollaborativeDocument(null, canonical, "Médias");
  const stored = first.snapshot();
  const second = new CollaborativeDocument(
    stored.state,
    stored.content,
    "Médias",
  );
  expect(second.snapshot().content).toEqual(canonical);
  expect(documentText(canonical)).toContain("Projet");
  expect(documentText(canonical)).toContain("Référence");
  first.destroy();
  second.destroy();
});

test.each([
  { type: "image", attrs: { src: "javascript:alert(1)" } },
  {
    type: "image",
    attrs: { src: "https://example.com/a.png", width: "expression(alert(1))" },
  },
  { type: "bookmark", attrs: { href: "data:text/html,a" } },
  { type: "bookmark", attrs: { href: "https://example.com", description: {} } },
  { type: "file", attrs: { href: "mailto:a@b.fr" } },
  {
    type: "mention",
    attrs: { kind: "person", referenceId: 3, label: "Nom", workspaceId: "w" },
  },
])("refuse les nouveaux attributs dangereux ou malformés : $type", (node) => {
  expect(
    documentSchema.safeParse({
      type: "doc",
      content:
        node.type === "mention"
          ? [{ type: "paragraph", content: [node] }]
          : [node],
    }).success,
  ).toBe(false);
});

test("les blocs à compléter sont valides et les mentions sont exclusivement inline", () => {
  for (const type of ["image", "file", "bookmark"])
    expect(
      documentSchema.safeParse({
        type: "doc",
        content: [{ type, attrs: { [type === "image" ? "src" : "href"]: "" } }],
      }).success,
    ).toBe(true);
  expect(
    documentSchema.safeParse({
      type: "doc",
      content: content.content![3]!.content,
    }).success,
  ).toBe(false);
});
