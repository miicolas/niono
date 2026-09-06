import { del, get, set } from "idb-keyval";
import { useCallback, useEffect, useRef, useState } from "react";
import { client } from "@/orpc/client";
import type { DocumentNode } from "@/validators/contracts";

type Status = "saved" | "dirty" | "saving" | "error" | "conflict";
type Draft = { content: DocumentNode; revision: number; time: number };
export function useDocumentSave(
  userId: string,
  workspaceId: string,
  pageId: string,
  initialRevision: number
) {
  const key = `digipm-draft:${userId}:${workspaceId}:${pageId}`;
  const [status, setStatus] = useState<Status>("saved");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftError, setDraftError] = useState(false);
  const state = useRef({
    revision: initialRevision,
    generation: 0,
    saved: 0,
    content: null as DocumentNode | null,
    pending: null as {
      content: DocumentNode;
      expectedRevision: number;
      mutationId: string;
      generation: number;
    } | null,
    paused: false,
  });
  const request = useRef<Promise<void> | null>(null);
  const disk = useRef(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
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
    void get<Draft>(key)
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
      if (alive.current) {
        setStatus("saving");
      }
      try {
        while (!s.paused && s.generation > s.saved && s.content) {
          const pending = s.pending ?? {
            content: s.content,
            expectedRevision: s.revision,
            mutationId: crypto.randomUUID(),
            generation: s.generation,
          };
          s.pending = pending;
          const result = await client.pages.save({
            pageId,
            expectedRevision: pending.expectedRevision,
            mutationId: pending.mutationId,
            content: pending.content,
          });
          s.revision = result.revision;
          s.saved = pending.generation;
          s.pending = null;
        }
        if (s.generation === s.saved) {
          await persist(() => del(key));
          if (alive.current) {
            setStatus(s.generation === s.saved ? "saved" : "dirty");
          }
        }
      } catch (error) {
        const code =
          error && typeof error === "object" && "code" in error
            ? error.code
            : "";
        s.paused = code === "CONFLICT";
        if (alive.current) {
          setStatus(s.paused ? "conflict" : "error");
        }
      } finally {
        request.current = null;
      }
    })();
    return request.current;
  }, [pageId, key, persist]);
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
      void persist(() => set(key, draft));
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => void flush(), 700);
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
    const retry = () => void flush();
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
