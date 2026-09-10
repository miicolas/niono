import { changeMedia } from "./change-media";
import { useEffect, useRef, useState } from "react";
import type { Transaction } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import type { UploadHandler } from "./media-types";

type UploadJob = {
  batch: string;
  id: string;
  file: File;
  pos: number;
  status: "waiting" | "sending" | "error";
  error?: string;
  request: AbortController;
};
export function useEditorUploads(
  editor: Editor | null,
  onUpload: UploadHandler,
) {
  const jobs = useRef(new Map<string, UploadJob>());
  const [visible, setVisible] = useState<UploadJob[]>([]);
  const refresh = () =>
    setVisible([...jobs.current.values()].map((job) => ({ ...job })));
  useEffect(() => {
    if (!editor) return;
    const mapPositions = ({ transaction }: { transaction: Transaction }) => {
      if (!transaction) return;
      for (const job of jobs.current.values())
        job.pos = transaction.mapping.map(job.pos, 1);
      if (!editor.isEditable) {
        for (const job of jobs.current.values()) job.request.abort();
        jobs.current.clear();
        refresh();
      }
    };
    editor.on("transaction", mapPositions);
    return () => {
      editor.off("transaction", mapPositions);
      for (const job of jobs.current.values()) job.request.abort();
      jobs.current.clear();
    };
  }, [editor]);
  const send = async (job: UploadJob) => {
    if (
      !editor ||
      editor.isDestroyed ||
      !editor.isEditable ||
      !jobs.current.has(job.id)
    )
      return;
    job.request = new AbortController();
    job.status = "sending";
    job.error = undefined;
    refresh();
    try {
      const result = await onUpload(job.file, job.request.signal);
      if (
        job.request.signal.aborted ||
        editor.isDestroyed ||
        !editor.isEditable ||
        !jobs.current.has(job.id)
      )
        return;
      const blockId = crypto.randomUUID();
      changeMedia(editor, () =>
        editor.commands.insertContentAt(
          job.pos,
          {
            type: result.mime.startsWith("image/") ? "image" : "file",
            attrs: {
              id: blockId,
              [result.mime.startsWith("image/") ? "src" : "href"]: result.url,
              name: result.name,
              size: result.size ?? job.file.size,
              alt: "",
            },
          },
          { updateSelection: false },
        ),
      );
      editor.state.doc.descendants((node, pos) => {
        if (node.attrs.id !== blockId) return;
        for (const next of jobs.current.values()) {
          if (next.batch === job.batch && next.status === "waiting")
            next.pos = pos + node.nodeSize;
        }
      });
      jobs.current.delete(job.id);
    } catch (cause) {
      if (job.request.signal.aborted) return;
      job.status = "error";
      job.error = cause instanceof Error ? cause.message : "Envoi impossible.";
    } finally {
      if (!job.request.signal.aborted && !editor.isDestroyed) refresh();
    }
  };
  return {
    jobs: visible,
    upload: async (files: File[], pos = editor?.state.selection.from ?? 0) => {
      if (!editor?.isEditable) return;
      const batchId = crypto.randomUUID();
      const batch = files.map((file) => ({
        id: crypto.randomUUID(),
        batch: batchId,
        file,
        pos,
        status: "waiting" as const,
        request: new AbortController(),
      }));
      for (const job of batch) jobs.current.set(job.id, job);
      refresh();
      for (const job of batch) await send(job);
    },
    retry: (id: string) => {
      const job = jobs.current.get(id);
      if (job?.status === "error") void send(job);
    },
    cancel: (id: string) => {
      jobs.current.get(id)?.request.abort();
      jobs.current.delete(id);
      refresh();
    },
  };
}
