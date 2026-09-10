import { z } from "zod";

export const schema = z.object({
  name: z.string().max(100),
  email: z.email("Entrez une adresse email valide."),
  password: z.string().min(10, "Utilisez au moins 10 caractères."),
});
