import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, pool, schema as s } from "@/db";
import type { DocumentNode } from "@/lib/editor/document-node";
import { addEntry } from "@/server/services/databases/add-entry";
import { addProperty } from "@/server/services/databases/add-property";
import { getDatabase } from "@/server/services/databases/get-database";
import { saveView } from "@/server/services/databases/save-view";
import { updateCell } from "@/server/services/databases/update-cell";
import { createPage } from "@/server/services/pages/create-page";
import { favoritePage } from "@/server/services/pages/favorite-page";
import { listPages } from "@/server/services/pages/list-pages";
import { ensureWorkspace } from "@/server/services/workspaces/ensure-workspace";
import { viewSchema } from "@/validators/databases";

const email = process.env.DEMO_EMAIL ?? "atelier@digipm.test";
const password = process.env.DEMO_PASSWORD;
if (!password || password.length < 10) {
  throw new Error(
    "Définissez DEMO_PASSWORD (10 caractères minimum) pour créer le compte de démonstration."
  );
}
try {
  const [existing] = await db
    .select()
    .from(s.user)
    .where(eq(s.user.email, email));
  const user =
    existing ??
    (
      await auth.api.signUpEmail({
        body: { email, password, name: "Atelier DigiPM" },
      })
    ).user;
  const workspaceId = await ensureWorkspace(user.id);
  const pages = await listPages(user.id, workspaceId);
  if (pages.some((p) => p.title === "L’atelier des idées")) {
    console.info("Démonstration déjà installée.");
    process.exitCode = 0;
  } else {
    const content: DocumentNode = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Un lieu calme pour penser, écrire et construire la suite. Faites comme chez vous.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "De la place pour vos idées" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Tout commence par une note. Une intuition, une conversation, un détail à ne pas oublier. Ici, vos idées peuvent prendre la forme qui leur convient.",
            },
          ],
        },
        {
          type: "callout",
          attrs: { emoji: "💡" },
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Astuce : ", marks: [{ type: "bold" }] },
                {
                  type: "text",
                  text: "tapez / pour insérer un bloc. Sélectionnez du texte pour faire apparaître les outils de mise en forme.",
                },
              ],
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Quelques pistes pour commencer" }],
        },
        {
          type: "taskList",
          content: [
            {
              type: "taskItem",
              attrs: { checked: true },
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Trouver un endroit pour rassembler ses idées",
                    },
                  ],
                },
              ],
            },
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Esquisser les contours du prochain projet",
                    },
                  ],
                },
              ],
            },
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Faire une petite chose qui compte, aujourd’hui",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Moins de bruit. Plus de sens." }],
        },
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Gardez le cap, laissez de la place à l’imprévu.",
                },
              ],
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Ce document est un exemple. Modifiez-le, déplacez ses blocs, ajoutez vos propres pages. Votre espace commence ici.",
            },
          ],
        },
        { type: "paragraph" },
      ],
    };
    const home = await createPage(user.id, {
      workspaceId,
      title: "L’atelier des idées",
      icon: "✳️",
      content,
    });
    await favoritePage(user.id, home.id, true);
    await createPage(user.id, {
      workspaceId,
      parentId: home.id,
      title: "Carnet d’inspiration",
      icon: "💡",
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Les idées à garder près de soi" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Un carnet ouvert. Ajoutez ici une pensée, une référence ou le début d’une nouvelle aventure.",
              },
            ],
          },
        ],
      },
    });
    const base = await createPage(user.id, {
      workspaceId,
      title: "Nos projets",
      icon: "🧭",
      kind: "database",
    });
    const metadata = await getDatabase(user.id, base.id);
    const date = await addProperty(user.id, {
      pageId: base.id,
      name: "Échéance",
      type: "date",
      options: [],
    });
    const priority = await addProperty(user.id, {
      pageId: base.id,
      name: "Priorité",
      type: "select",
      options: [
        { id: "high", name: "Haute", color: "red" },
        { id: "normal", name: "Normale", color: "gray" },
      ],
    });
    for (const [i, title] of [
      "Imaginer notre nouveau site",
      "Préparer le prochain atelier",
      "Écrire le guide de bienvenue",
      "Rassembler nos inspirations",
    ].entries()) {
      // biome-ignore lint/nursery/noAwaitInLoop: entrées créées dans l’ordre d’affichage
      const entry = await addEntry(user.id, { pageId: base.id, title });
      await updateCell(user.id, {
        pageId: entry.id,
        propertyId: metadata.properties[0]?.id,
        value: ["progress", "todo", "done", "todo"][i] ?? "todo",
        expectedRevision: 0,
      });
      await updateCell(user.id, {
        pageId: entry.id,
        propertyId: date.id,
        value: `2026-09-${String(10 + i * 4).padStart(2, "0")}`,
        expectedRevision: 0,
      });
      await updateCell(user.id, {
        pageId: entry.id,
        propertyId: priority.id,
        value: i === 0 ? "high" : "normal",
        expectedRevision: 0,
      });
    }
    for (const [layout, name] of [
      ["board", "Par statut"],
      ["gallery", "Galerie"],
      ["calendar", "Calendrier"],
    ] as const) {
      // biome-ignore lint/nursery/noAwaitInLoop: vues enregistrées dans l’ordre des onglets
      await saveView(user.id, {
        pageId: base.id,
        name,
        config: viewSchema.parse({ layout }),
      });
    }
    await favoritePage(user.id, base.id, true);
    console.info(
      `Démonstration créée pour ${email}. Ouvrez ${process.env.BETTER_AUTH_URL}/?w=${workspaceId}&p=${home.id}`
    );
  }
} finally {
  await pool.end();
}
