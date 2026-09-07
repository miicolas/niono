import { resolve } from "node:path";
import { env } from "@/env/server";

/** Dossier local où sont stockés les fichiers de l'espace. */
export const assetRoot = () => resolve(env.ASSET_DIR);
