import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/notifications";
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Saisissez votre mot de passe actuel."),
    newPassword: z
      .string()
      .min(10, "Utilisez au moins 10 caractères.")
      .max(128),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, {
    path: ["confirm"],
    message: "Les mots de passe ne correspondent pas.",
  });
export function AccountSettings({
  name,
  onUpdated,
}: {
  name: string;
  onUpdated: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const profile = useForm({
    defaultValues: { name },
    resolver: zodResolver(
      z.object({ name: z.string().trim().min(1).max(100) }),
    ),
  });
  const password = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirm: "" },
    resolver: zodResolver(passwordSchema),
  });
  return (
    <div className="space-y-6">
      <form
        className="panel-form"
        onSubmit={profile.handleSubmit(async (values) => {
          setBusy(true);
          try {
            const result = await authClient.updateUser(values);
            if (result.error) throw new Error(result.error.message);
            await onUpdated();
            toast.success("Profil enregistré");
          } catch (e) {
            reportError(e);
          } finally {
            setBusy(false);
          }
        })}
      >
        <label>
          Votre nom
          <Input autoComplete="name" {...profile.register("name")} />
        </label>
        {profile.formState.errors.name && (
          <p role="alert">Saisissez un nom de 1 à 100 caractères.</p>
        )}
        <Button disabled={busy} variant="outline">
          Enregistrer le profil
        </Button>
      </form>
      <form
        className="panel-form"
        onSubmit={password.handleSubmit(async (values) => {
          setBusy(true);
          try {
            const result = await authClient.changePassword({
              currentPassword: values.currentPassword,
              newPassword: values.newPassword,
              revokeOtherSessions: true,
            });
            if (result.error) throw new Error(result.error.message);
            password.reset();
            toast.success(
              "Mot de passe changé. Les autres sessions ont été fermées.",
            );
          } catch (e) {
            reportError(e);
          } finally {
            setBusy(false);
          }
        })}
      >
        <label>
          Mot de passe actuel
          <Input
            type="password"
            autoComplete="current-password"
            {...password.register("currentPassword")}
          />
        </label>
        <label>
          Nouveau mot de passe
          <Input
            type="password"
            autoComplete="new-password"
            {...password.register("newPassword")}
          />
        </label>
        <label>
          Confirmer le mot de passe
          <Input
            type="password"
            autoComplete="new-password"
            {...password.register("confirm")}
          />
        </label>
        {Object.values(password.formState.errors).map((error, i) => (
          <p role="alert" key={i}>
            {error.message}
          </p>
        ))}
        <Button disabled={busy}>Changer le mot de passe</Button>
      </form>
    </div>
  );
}
