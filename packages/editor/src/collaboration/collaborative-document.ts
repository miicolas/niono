import * as Y from "yjs";
import {
  prosemirrorJSONToYDoc,
  yXmlFragmentToProseMirrorRootNode,
  updateYFragment,
} from "y-prosemirror";
import { documentSchema, type DocumentNode } from "@digipm/contracts";
import { schema } from "../document-transform/shared";
import { canonicalDocument } from "../document-transform/canonical-document";
import { replaceSharedText } from "./replace-shared-text";

/** Durable CRDT plus the JSON projection used by exports, history and search. */
export class CollaborativeDocument {
  readonly doc: Y.Doc;
  constructor(state: Uint8Array | null, content: DocumentNode, title: string) {
    if (state) {
      this.doc = new Y.Doc();
      Y.applyUpdate(this.doc, state);
    } else {
      this.doc = prosemirrorJSONToYDoc(
        schema,
        canonicalDocument(content),
        "default",
      );
      this.doc.getText("title").insert(0, title);
    }
  }
  replace(content?: DocumentNode, title?: string) {
    this.doc.transact(() => {
      if (content) {
        const node = schema.nodeFromJSON(canonicalDocument(content));
        updateYFragment(this.doc, this.doc.getXmlFragment("default"), node, {
          mapping: new Map(),
          isOMark: new Map(),
        });
      }
      if (title !== undefined)
        replaceSharedText(this.doc.getText("title"), title);
    });
  }
  apply(update: Uint8Array) {
    Y.applyUpdate(this.doc, update);
  }
  snapshot() {
    const node = yXmlFragmentToProseMirrorRootNode(
      this.doc.getXmlFragment("default"),
      schema,
    );
    node.check();
    const content = documentSchema.parse(node.toJSON());
    const title = this.doc.getText("title").toString();
    if (title.length > 300 || /[\r\n]/.test(title))
      throw new Error("Titre invalide");
    if (
      [...this.doc.share.keys()].some(
        (key) => key !== "default" && key !== "title",
      )
    )
      throw new Error("Champ collaboratif inconnu");
    const state = Y.encodeStateAsUpdate(this.doc);
    if (state.byteLength > 2 * 1024 * 1024)
      throw new Error("Document collaboratif trop volumineux");
    return { content, title, state };
  }
  diff(vector?: Uint8Array) {
    return Y.encodeStateAsUpdate(this.doc, vector);
  }
  vector() {
    return Y.encodeStateVector(this.doc);
  }
  destroy() {
    this.doc.destroy();
  }
}
