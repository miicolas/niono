import { resolve } from "node:path";
export function pmDirectory() {
  return resolve(
    process.env.INIT_CWD ?? process.cwd(),
    process.env.PM_OS_DATA_DIR ?? ".data/pm-os",
  );
}
