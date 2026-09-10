import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { client } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { importPmSource } from "./import-source";
export type PmContext = Awaited<ReturnType<typeof client.pm.context>>;
const roles = {
  company: "Entreprise",
  strategy: "Stratégie",
  style: "Style rédactionnel",
  stakeholders: "Parties prenantes",
  research: "Recherche",
  metrics: "Métriques",
  decisions: "Décisions",
  meetings: "Réunions",
  reference: "Source",
} as const;
export function ContextReferences({
  workspaceId,
  context,
  onChange,
}: {
  workspaceId: string;
  context: PmContext;
  onChange: () => Promise<void>;
}) {
  const [page, setPage] = useState("");
  const [role, setRole] = useState<keyof typeof roles>("reference");
  const [scope, setScope] = useState<"workspace" | "subject">(
    context.selectedSubjectId ? "subject" : "workspace",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const subjectId = scope === "subject" ? context.selectedSubjectId : null;
  const parentId = subjectId
    ? context.subjects.find((subject) => subject.id === subjectId)?.pageId
    : context.settings?.companyPageId;
  const execute = async (work: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
      await onChange();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="pm-reference-settings">
      <p className="pm-caption">
        Les pages de référence restent éditables dans l’espace. Les changements
        proposés par Codex demandent votre validation.
      </p>
      <Select
        value={scope}
        onValueChange={(value) => setScope(value as "workspace" | "subject")}
        disabled={busy}
      >
        <SelectTrigger aria-label="Portée des références">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="workspace">
            Contexte commun de l’entreprise
          </SelectItem>
          {context.selectedSubjectId && (
            <SelectItem value="subject">Sujet actif</SelectItem>
          )}
        </SelectContent>
      </Select>
      <ul className="pm-references">
        {context.references
          .filter((ref) => ref.subjectId === subjectId)
          .map((ref) => (
            <li key={ref.pageId}>
              <a href={`/?w=${workspaceId}&p=${ref.pageId}`}>{ref.title}</a>
              <span>
                {roles[ref.role as keyof typeof roles] ?? ref.role} · r
                {ref.revision}
              </span>
            </li>
          ))}
      </ul>
      <Select value={page} onValueChange={setPage} disabled={busy}>
        <SelectTrigger aria-label="Page à rattacher">
          <SelectValue placeholder="Choisir une page existante" />
        </SelectTrigger>
        <SelectContent>
          {context.pages.map((page) => (
            <SelectItem key={page.id} value={page.id}>
              {page.title || "Sans titre"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={role}
        onValueChange={(value) => setRole(value as keyof typeof roles)}
        disabled={busy}
      >
        <SelectTrigger aria-label="Rôle de la référence">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(roles).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="pm-actions">
        <Button
          size="sm"
          disabled={busy || !page}
          onClick={() => {
            void execute(() =>
              client.pm.bindContext({
                workspaceId,
                subjectId,
                pageId: page,
                role,
              }),
            );
          }}
        >
          Rattacher cette page
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || !parentId}
          onClick={() => file.current?.click()}
        >
          <Upload size={14} /> Importer une source
        </Button>
      </div>
      <input
        ref={file}
        type="file"
        className="sr-only"
        aria-label="Fichier source"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected && parentId)
            void execute(() =>
              importPmSource(workspaceId, parentId, subjectId, selected),
            );
          event.target.value = "";
        }}
      />
      <p className="pm-caption">20 Mo maximum par fichier.</p>
      {error && (
        <p role="alert" className="pm-error">
          {error}
        </p>
      )}
    </div>
  );
}
