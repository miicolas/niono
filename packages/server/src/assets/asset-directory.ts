import { resolve } from "node:path";

export function assetDirectory() {
  return resolve(process.env.ASSET_DIR ?? ".data/assets");
}
