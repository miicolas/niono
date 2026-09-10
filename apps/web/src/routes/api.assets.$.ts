import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@digipm/server/auth";
import { MAX_ASSET_BYTES, readAsset, storeAsset } from "@digipm/server/assets";
import { z } from "zod";
export const Route = createFileRoute("/api/assets/$")({
  server: {
    handlers: {
      ANY: async ({ request, params }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Connexion requise", { status: 401 });
        const id = params._splat;
        if (!z.uuid().safeParse(id).success)
          return new Response("Introuvable", { status: 404 });
        try {
          if (request.method === "GET") {
            const { asset, bytes } = await readAsset(session.user.id, id!);
            return new Response(new Uint8Array(bytes), {
              headers: {
                "Content-Type": asset.mime,
                "Content-Length": String(bytes.length),
                "X-Content-Type-Options": "nosniff",
                "Cache-Control": "private, no-store",
                "Content-Disposition": `${asset.mime.startsWith("image/") && !new URL(request.url).searchParams.has("download") ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(asset.name)}`,
                "Content-Security-Policy": "default-src 'none'; sandbox",
              },
            });
          }
          if (request.method !== "POST")
            return new Response("Méthode non autorisée", { status: 405 });
          if (
            request.headers.get("origin") !==
            new URL(process.env.BETTER_AUTH_URL!).origin
          )
            return new Response("Origine refusée", { status: 403 });
          if (Number(request.headers.get("content-length")) > MAX_ASSET_BYTES)
            return new Response("Fichier trop volumineux", { status: 413 });
          const reader = request.body?.getReader();
          if (!reader) return new Response("Fichier manquant", { status: 400 });
          const chunks: Uint8Array[] = [];
          let size = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.length;
            if (size > MAX_ASSET_BYTES) {
              await reader.cancel();
              return new Response("Fichier trop volumineux", { status: 413 });
            }
            chunks.push(value);
          }
          const bytes = new Uint8Array(size);
          let offset = 0;
          for (const chunk of chunks) {
            bytes.set(chunk, offset);
            offset += chunk.length;
          }
          const result = await storeAsset(
            session.user.id,
            id!,
            decodeURIComponent(request.headers.get("x-file-name") ?? "Fichier"),
            bytes,
          );
          return Response.json(result);
        } catch (error) {
          const code =
            error && typeof error === "object" && "code" in error
              ? error.code
              : "";
          return Response.json(
            {
              message:
                code === "BAD_REQUEST"
                  ? "Fichier invalide."
                  : "Fichier indisponible.",
            },
            { status: code === "BAD_REQUEST" ? 400 : 404 },
          );
        }
      },
    },
  },
});
