import { Extension } from "@tiptap/core";
import { type EditorState, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

type PlaceholderMeta =
  | {
      type: "add";
      id: string;
      pos: number;
      preview: string | null;
      label: string;
    }
  | { type: "remove"; id: string };

export const uploadPlaceholderKey = new PluginKey<DecorationSet>(
  "uploadPlaceholder"
);

function placeholderElement(preview: string | null, label: string) {
  const wrapper = document.createElement("div");
  wrapper.className = "editor-upload-placeholder";
  if (preview) {
    const image = document.createElement("img");
    image.alt = "";
    image.src = preview;
    wrapper.append(image);
  }
  const caption = document.createElement("span");
  caption.textContent = label;
  wrapper.append(caption);
  return wrapper;
}

/** Position actuelle d'un aperçu d'envoi, ou `null` s'il a disparu du document. */
export function placeholderPos(state: EditorState, id: string) {
  const [found] =
    uploadPlaceholderKey
      .getState(state)
      ?.find(undefined, undefined, (spec) => spec.id === id) ?? [];
  return found ? found.from : null;
}

/** Transaction qui affiche un aperçu d'envoi à une position donnée. */
export function addPlaceholder(
  state: EditorState,
  meta: Omit<PlaceholderMeta & { type: "add" }, "type">
) {
  return state.tr.setMeta(uploadPlaceholderKey, { type: "add", ...meta });
}

/** Transaction qui retire un aperçu d'envoi. */
export function removePlaceholder(state: EditorState, id: string) {
  return state.tr.setMeta(uploadPlaceholderKey, { type: "remove", id });
}

/**
 * Aperçu affiché pendant l'envoi d'un fichier. C'est une décoration : elle
 * suit les modifications du document sans jamais y écrire, si bien qu'un envoi
 * en cours n'entre pas dans l'historique ni dans la version enregistrée.
 */
export const UploadPlaceholder = Extension.create({
  name: "uploadPlaceholder",
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: uploadPlaceholderKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, value) {
            const set = value.map(tr.mapping, tr.doc);
            const meta = tr.getMeta(uploadPlaceholderKey) as
              | PlaceholderMeta
              | undefined;
            if (meta?.type === "add") {
              return set.add(tr.doc, [
                Decoration.widget(
                  meta.pos,
                  placeholderElement(meta.preview, meta.label),
                  { id: meta.id, side: 1 }
                ),
              ]);
            }
            if (meta?.type === "remove") {
              return set.remove(
                set.find(undefined, undefined, (spec) => spec.id === meta.id)
              );
            }
            return set;
          },
        },
        props: {
          decorations: (state) => uploadPlaceholderKey.getState(state),
        },
      }),
    ];
  },
});
