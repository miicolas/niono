import { z } from "zod";
import { ActionForm } from "@/components/action-form";
import { listWorkspacePeople } from "@/lib/organization";
import { client } from "@/lib/api";

export function ShareForm({
  pageId,
  isPrivate,
  members,
  grants,
  onDone,
}: {
  pageId: string;
  isPrivate: boolean;
  grants: { userId: string; role: "editor" | "viewer" }[];
  members: Awaited<ReturnType<typeof listWorkspacePeople>>;
  onDone: () => Promise<void>;
}) {
  return (
    <ActionForm
      schema={z
        .object({ audience: z.enum(["workspace", "private"]) })
        .catchall(z.enum(["none", "viewer", "editor"]))}
      defaultValues={{
        audience: isPrivate ? "private" : "workspace",
        ...Object.fromEntries(
          members.map((member) => [
            member.id,
            grants.find((grant) => grant.userId === member.id)?.role ?? "none",
          ]),
        ),
      }}
      fields={[
        {
          name: "audience",
          label: "Accès à la page",
          options: [
            { value: "workspace", label: "Membres de l’espace" },
            { value: "private", label: "Page privée" },
          ],
        },
        ...members.map((member) => ({
          name: member.id,
          label: "Accès de " + member.name,
          when: (values: Record<string, string>) =>
            values.audience === "private",
          options: [
            { value: "none", label: "Aucun" },
            { value: "viewer", label: "Lecture" },
            { value: "editor", label: "Modification" },
          ],
        })),
      ]}
      submitLabel="Enregistrer les accès"
      onSubmit={async (values) => {
        const grants = members.flatMap<{
          userId: string;
          role: "editor" | "viewer";
        }>((member) => {
          const role = values[member.id];
          return role === "editor" || role === "viewer"
            ? [{ userId: member.id, role }]
            : [];
        });
        await client.pages.share({
          pageId,
          privateRoot: values.audience === "private",
          grants,
        });
        await onDone();
      }}
    />
  );
}
