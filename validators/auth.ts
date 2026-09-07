import { z } from "zod";
import { invitationTokenSchema } from "./workspaces";

export const credentialsSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.email("Entrez une adresse email valide."),
  password: z.string().min(10, "Utilisez au moins 10 caractères."),
});
export type Credentials = z.infer<typeof credentialsSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Entrez votre mot de passe actuel."),
    newPassword: z.string().min(10, "Utilisez au moins 10 caractères."),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, {
    message: "Les deux mots de passe doivent correspondre.",
    path: ["confirm"],
  });

export const signInSearchSchema = z.object({
  invite: invitationTokenSchema.optional().catch(undefined),
});

export const resetPasswordSearchSchema = z.object({
  token: z.string().optional().catch(undefined),
});
