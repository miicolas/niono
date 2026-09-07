import { del, get, set } from "idb-keyval";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DocumentNode } from "@/lib/editor/document-node";
import { orpcClient } from "@/orpc/client";

export type DocumentSaveStatus =
  | "saved"
  | "dirty"
  | "saving"
  | "error"
  | "conflict";
type Draft = { content: DocumentNode; revision: number; time: number };
type Pending = {
  content: DocumentNode;
  expectedRevision: number;
  mutationId: string;
  generation: number;
};
type SaveState = {
  revision: number;
  generation: number;
  saved: number;
  content: DocumentNode | null;
  pending: Pending | null;
  paused: boolean;
};
/** Envoie les générations en attente tant qu'aucun conflit ne met la file en pause. */
async function pushPending(s: SaveState, pageId: string) {
  while (!s.paused && s.generation > s.saved && s.content) {
    const pending = s.pending ?? {
      content: s.content,
      expectedRevision: s.revision,
      mutationId: crypto.randomUUID(),
      generation: s.generation,
    };
    s.pending = pending;
    // biome-ignore lint/nursery/noAwaitInLoop: chaque envoi dépend de la révision renvoyée par le précédent
    const result = await orpcClient.documents.save({
      pageId,
      expectedRevision: pending.expectedRevision,
      mutationId: pending.mutationId,
      content: pending.content,
    });
    s.revision = result.revision;
    s.saved = pending.generation;
    s.pending = null;
  }
}
function errorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error
    ? error.code
    : "";
}
export function useDocumentSave(
  userId: string,
  workspaceId: string,
  pageId: string,
  initialRevision: number
) {
  const key = `digipm-draft:${userId}:${workspaceId}:${pageId}`;
  const [status, setStatus] = useState<DocumentSaveStatus>("saved");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftError, setDraftError] = useState(false);
  const state = useRef<SaveState>({
    revision: initialRevision,
    generation: 0,
    saved: 0,
    content: null,
    pending: null,
    paused: false,
  });
  const request = useRef<Promise<void> | null>(null);
  const disk = useRef(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  /** Met à jour l'état affiché, sauf si le composant a été démonté. */
  const setStatusIfAlive = useCallback((next: DocumentSaveStatus) => {
    if (alive.current) {
      setStatus(next);
    }
  }, []);
  const persist = useCallback((operation: () => Promise<unknown>) => {
    disk.current = disk.current
      .then(operation)
      .then(() => {
        if (alive.current) {
          setDraftError(false);
        }
      })
      .catch(() => {
        if (alive.current) {
          setDraftError(true);
        }
      });
    return disk.current;
  }, []);
  useEffect(() => {
    alive.current = true;
    get<Draft>(key)
      .then((value) => {
        if (alive.current && value && state.current.generation === 0) {
          setDraft(value);
        }
      })
      .catch(() => setDraftError(true));
    return () => {
      alive.current = false;
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [key]);
  const flush = useCallback(() => {
    if (request.current) {
      return request.current;
    }
    const s = state.current;
    if (s.paused || s.generation === s.saved || !s.content) {
      return Promise.resolve();
    }
    request.current = (async () => {
      setStatusIfAlive("saving");
      try {
        await pushPending(s, pageId);
        if (s.generation === s.saved) {
          await persist(() => del(key));
          setStatusIfAlive(s.generation === s.saved ? "saved" : "dirty");
        }
      } catch (error) {
        s.paused = errorCode(error) === "CONFLICT";
        setStatusIfAlive(s.paused ? "conflict" : "error");
      } finally {
        request.current = null;
      }
    })();
    return request.current;
  }, [pageId, key, persist, setStatusIfAlive]);
  const change = useCallback(
    (content: DocumentNode) => {
      const s = state.current;
      s.content = content;
      s.generation++;
      if (!s.paused) {
        setStatus("dirty");
      }
      const draft = {
        content,
        revision: s.revision,
        time: Date.now(),
      } satisfies Draft;
      persist(() => set(key, draft));
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => flush(), 700);
    },
    [flush, key, persist]
  );
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (state.current.generation !== state.current.saved) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const retry = () => flush();
    window.addEventListener("beforeunload", guard);
    window.addEventListener("online", retry);
    return () => {
      window.removeEventListener("beforeunload", guard);
      window.removeEventListener("online", retry);
    };
  }, [flush]);
  const dirty = () => state.current.generation !== state.current.saved;
  return {
    status,
    draft,
    draftError,
    change,
    flush,
    revision: () => state.current.revision,
    latest: () => state.current.content,
    dirty,
    recover: () => {
      const d = draft;
      if (d) {
        state.current.revision = d.revision;
        change(d.content);
        setDraft(null);
      }
      return d?.content;
    },
    ignoreRecovered: async () => {
      setDraft(null);
      if (!dirty()) {
        await persist(() => del(key));
      }
    },
    discard: async () => {
      if (request.current) {
        await request.current;
      }
      await persist(() => del(key));
      setDraft(null);
      state.current.generation = state.current.saved;
    },
  };
}

/** Valeur retournée par `useDocumentSave`. */
export type DocumentSave = ReturnType<typeof useDocumentSave>;
