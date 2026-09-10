import { importPack } from "../packages/server/src/pm-os/pack/import-pack";
const source = process.argv[2] ?? process.env.PM_OS_SOURCE_DIR;
if (!source)
  throw new Error(
    "Indiquez le dossier PM-OS : pnpm pm-os:import /chemin/PM-OS",
  );
console.log(JSON.stringify(await importPack(source), null, 2));
