import { z } from "zod";

export const passwordSchema = z
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
