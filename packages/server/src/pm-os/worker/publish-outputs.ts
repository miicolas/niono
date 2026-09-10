import JSZip from "jszip";
import { codeTaskSchema } from "@digipm/contracts/pm-os";
import type { z } from "zod";
import { createArtifact } from "../artifacts/create-artifact";
export async function publishOutputs(
  userId: string,
  conversationId: string,
  runId: string,
  input: z.infer<typeof codeTaskSchema>,
  files: { path: string; data: string }[],
  signal: AbortSignal,
) {
  const archive = new JSZip();
  if (input.runtime === "prototype")
    for (const file of input.files) archive.file(file.path, file.content);
  const artifacts = [] as Awaited<ReturnType<typeof createArtifact>>[];
  let total = 0;
  const paths = new Set<string>();
  for (const file of files) {
    signal.throwIfAborted();
    if (
      file.path.startsWith("/") ||
      file.path.includes("\\") ||
      file.path
        .split("/")
        .some((part) => !part || part === "." || part === "..") ||
      paths.has(file.path)
    )
      throw new Error("Chemin de sortie invalide.");
    paths.add(file.path);
    if (
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
        file.data,
      )
    )
      throw new Error("Sortie binaire invalide.");
    total += Buffer.byteLength(file.data, "base64");
    if (total > 50 * 1024 * 1024) throw new Error("Sorties trop volumineuses.");
    const name = file.path.split("/").at(-1)!;
    const extension = name.split(".").at(-1)?.toLowerCase();
    if (["pdf", "docx", "xlsx", "pptx"].includes(extension ?? ""))
      throw new Error(
        "Ce format d’export n’est pas pris en charge dans cette version.",
      );
    const format =
      extension === "md"
        ? "markdown"
        : extension === "csv"
          ? "csv"
          : extension === "json"
            ? "json"
            : ["html", "htm"].includes(extension ?? "")
              ? "html"
              : ["png", "jpg", "jpeg", "gif", "webp"].includes(extension ?? "")
                ? "image"
                : extension === "zip"
                  ? "zip"
                  : "code";
    const bytes = Buffer.from(file.data, "base64");
    if (!bytes.length) continue;
    artifacts.push(
      await createArtifact(userId, conversationId, runId, {
        key: input.key.slice(0, 70) + ":" + artifacts.length,
        title: input.title + " — " + name,
        name,
        format,
        data: file.data,
        encoding: "base64",
        description: "Généré par « " + input.title + " ».",
      }),
    );
    if (input.runtime === "prototype")
      archive.file("outputs/" + file.path, bytes);
  }
  if (input.runtime === "prototype") {
    const bytes = await archive.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
    });
    artifacts.push(
      await createArtifact(userId, conversationId, runId, {
        key: input.key.slice(0, 100) + ":sources",
        title: input.title + " — code source",
        name: "prototype-sources.zip",
        format: "zip",
        data: bytes.toString("base64"),
        encoding: "base64",
      }),
    );
  }
  return artifacts;
}
