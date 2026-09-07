import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { auth } from "@/auth";
import { MAX_ASSET_BYTES } from "@/constants/limits";
import { env } from "@/env/server";
import { readRequestBytes } from "@/server/lib/read-request-bytes";
import { assetResponse } from "@/server/services/assets/asset-response";
import { readAsset } from "@/server/services/assets/read-asset";
import { storeAsset } from "@/server/services/assets/store-asset";

const TOO_LARGE = "Choisissez un fichier de 20 Mo maximum.";

function failure(error: unknown) {
  const bad =
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "BAD_REQUEST";
  const message =
    bad && error instanceof Error ? error.message : "Fichier invalide.";
  return Response.json(
    { message: bad ? message : "Fichier indisponible." },
    { status: bad ? 400 : 404 }
  );
}

async function upload(request: Request, userId: string, pageId: string) {
  if (request.headers.get("origin") !== new URL(env.BETTER_AUTH_URL).origin) {
    return new Response("Origine refusée", { status: 403 });
  }
  if (Number(request.headers.get("content-length")) > MAX_ASSET_BYTES) {
    return Response.json({ message: TOO_LARGE }, { status: 413 });
  }
  const body = await readRequestBytes(request, MAX_ASSET_BYTES);
  if (!body.ok) {
    return Response.json(
      { message: body.reason === "empty" ? "Fichier vide." : TOO_LARGE },
      { status: body.reason === "empty" ? 400 : 413 }
    );
  }
  return Response.json(
    await storeAsset(
      userId,
      pageId,
      decodeURIComponent(request.headers.get("x-file-name") ?? "Fichier"),
      body.bytes
    )
  );
}

export const Route = createFileRoute("/api/assets/$")({
  server: {
    handlers: {
      ANY: async ({ request, params }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return new Response("Connexion requise", { status: 401 });
        }
        const parsed = z.uuid().safeParse(params._splat);
        if (!parsed.success) {
          return new Response("Introuvable", { status: 404 });
        }
        const id = parsed.data;
        try {
          if (request.method === "GET") {
            const { asset, bytes } = await readAsset(session.user.id, id);
            return assetResponse(
              asset,
              bytes,
              request.headers.get("if-none-match")
            );
          }
          if (request.method !== "POST") {
            return new Response("Méthode non autorisée", { status: 405 });
          }
          return await upload(request, session.user.id, id);
        } catch (error) {
          return failure(error);
        }
      },
    },
  },
});
