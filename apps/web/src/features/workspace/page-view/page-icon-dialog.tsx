import { z } from "zod";
import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { type PageState } from "./shared";

export function PageIconDialog({
  panel,
  setPanel,
  update,
  icon,
}: Pick<PageState, "panel" | "setPanel" | "update" | "icon">) {
  return (
    <Dialog
      open={panel === "icon"}
      onOpenChange={(v) => {
        if (!v) setPanel("none");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Une icône pour votre page</DialogTitle>
          <DialogDescription>
            Choisissez un symbole, ou écrivez le vôtre.
          </DialogDescription>
        </DialogHeader>
        <div className="emoji-grid">
          {"📄 📝 ✳️ 💡 📚 🌿 🪴 🎯 🚀 🗓️ 💬 🧭 🏡 💼 🎨 🧪 ☕ 📌 🔖 🌙 ⚡ 🏗️ 📊 🔮"
            .split(" ")
            .map((emoji) => (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                key={emoji}
                onClick={async () => {
                  if (await update({ icon: emoji })) setPanel("none");
                }}
              >
                {emoji}
              </Button>
            ))}
        </div>
        <ActionForm
          schema={z.object({ icon: z.string().max(50) })}
          defaultValues={{ icon }}
          fields={[
            { name: "icon", label: "Icône personnalisée", maxLength: 50 },
          ]}
          submitLabel="Utiliser"
          onSubmit={async ({ icon }) => {
            if (await update({ icon })) setPanel("none");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
