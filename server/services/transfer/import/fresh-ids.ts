import { randomUUID } from "node:crypto";
import { badRequest } from "./bad-request";
import type { IdMap } from "./id-map";

/** Nouveaux identifiants pour chaque élément de l'archive ; refuse les doublons. */
export function freshIds<T extends { id: string }>(items: T[]): IdMap {
  const map = new Map(items.map((item) => [item.id, randomUUID()]));
  if (map.size !== items.length) {
    throw badRequest("Identifiants dupliqués dans l’archive.");
  }
  return map;
}
