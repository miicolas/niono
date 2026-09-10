import { useEditorUI } from "../document-editor/use-editor-ui";
import type { useEditorUploads } from "./use-editor-uploads";

export function EditorUploadStatus({
  uploads,
}: {
  uploads: ReturnType<typeof useEditorUploads>;
}) {
  const { Button, Spinner } = useEditorUI();
  if (!uploads.jobs.length) return null;
  return (
    <div className="editor-upload-status" aria-live="polite">
      {uploads.jobs.map((job) => (
        <div key={job.id} className="upload-status-row">
          {job.status === "sending" && <Spinner />}
          <span>
            <strong>{job.file.name}</strong>
            <small>
              {job.status === "error"
                ? job.error
                : job.status === "waiting"
                  ? "En attente…"
                  : "Envoi en cours…"}
            </small>
          </span>
          {job.status === "error" && (
            <Button onClick={() => uploads.retry(job.id)}>Réessayer</Button>
          )}
          <Button
            aria-label={`Annuler l’envoi de ${job.file.name}`}
            onClick={() => uploads.cancel(job.id)}
          >
            Annuler
          </Button>
        </div>
      ))}
    </div>
  );
}
