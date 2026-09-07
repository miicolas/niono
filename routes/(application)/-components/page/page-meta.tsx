import { LockKeyhole } from "lucide-react";

type Props = {
  userName: string;
  privateRoot: boolean;
  updatedAt: string | Date;
  canEdit: boolean;
};

export function PageMeta({ userName, privateRoot, updatedAt, canEdit }: Props) {
  return (
    <div className="document-meta">
      <span className="avatar">{userName.slice(0, 1)}</span>
      <span>
        {privateRoot ? (
          <>
            <LockKeyhole className="inline" size={11} /> Page privée
          </>
        ) : (
          "Espace de travail"
        )}
      </span>
      <span className="dot">·</span>
      <span>
        {new Date(updatedAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
        })}
      </span>
      {!canEdit && <span>· Lecture seule</span>}
    </div>
  );
}
