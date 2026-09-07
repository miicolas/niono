import { z } from "zod";

export const idSchema = z.uuid();
export const roleSchema = z.enum(["owner", "editor", "viewer"]);
