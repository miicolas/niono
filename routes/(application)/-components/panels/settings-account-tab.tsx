import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { reportError } from "@/lib/ui/notifications";

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
const profileSchema = z.object({ name: z.string().trim().min(1).max(100) });
export function SettingsAccountTab({
  name,
  onUpdated,
}: {
  name: string;
  onUpdated: () => Promise<void>;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const profile = useForm({
    defaultValues: { name },
    resolver: zodResolver(profileSchema),
  });
  const password = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirm: "" },
    resolver: zodResolver(passwordSchema),
  });
  const saveProfile = profile.handleSubmit(async (values) => {
    setBusy(true);
    try {
      const result = await authClient.updateUser(values);
      if (result.error) {
        throw new Error(result.error.message);
      }
      await onUpdated();
      toast.success("Profil enregistré");
    } catch (e) {
      reportError(e);
    } finally {
      setBusy(false);
    }
  });
  const changePassword = password.handleSubmit(async (values) => {
    setBusy(true);
    try {
      const result = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      password.reset();
      toast.success(
        "Mot de passe changé. Les autres sessions ont été fermées."
      );
    } catch (e) {
      reportError(e);
    } finally {
      setBusy(false);
    }
  });
  return (
    <div className="space-y-6">
      <form className="panel-form" onSubmit={saveProfile}>
        <label htmlFor={`${id}-name`}>
          Votre nom
          <Input
            autoComplete="name"
            id={`${id}-name`}
            {...profile.register("name")}
          />
        </label>
        {profile.formState.errors.name && (
          <p role="alert">Saisissez un nom de 1 à 100 caractères.</p>
        )}
        <Button disabled={busy} variant="outline">
          Enregistrer le profil
        </Button>
      </form>
      <form className="panel-form" onSubmit={changePassword}>
        <label htmlFor={`${id}-current`}>
          Mot de passe actuel
          <Input
            autoComplete="current-password"
            id={`${id}-current`}
            type="password"
            {...password.register("currentPassword")}
          />
        </label>
        <label htmlFor={`${id}-new`}>
          Nouveau mot de passe
          <Input
            autoComplete="new-password"
            id={`${id}-new`}
            type="password"
            {...password.register("newPassword")}
          />
        </label>
        <label htmlFor={`${id}-confirm`}>
          Confirmer le mot de passe
          <Input
            autoComplete="new-password"
            id={`${id}-confirm`}
            type="password"
            {...password.register("confirm")}
          />
        </label>
        {Object.values(password.formState.errors).map((error, i) => (
          <p key={i} role="alert">
            {error.message}
          </p>
        ))}
        <Button disabled={busy}>Changer le mot de passe</Button>
      </form>
    </div>
  );
}
