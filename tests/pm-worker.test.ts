import { test, expect } from "vitest";
import { runCode } from "../packages/server/src/pm-os/worker/run-code";
import { readSourceFile } from "../packages/server/src/pm-os/artifacts/read-source-file";
import { pmFixture } from "./pm/fixture";
import { storeAsset } from "../packages/server/src/assets/store-asset";
import { workerRequest } from "../packages/server/src/pm-os/worker/worker-request";
import { createHash } from "node:crypto";
const enabled = !!process.env.PM_WORKER_URL && !!process.env.PM_WORKER_TOKEN;
test.skipIf(!enabled)(
  "CSV autorisé vers graphique, fichiers persistés et calcul idempotent",
  async () => {
    const f = await pmFixture();
    const asset = await storeAsset(
      f.userId,
      f.page.id,
      "metrics.csv",
      Buffer.from("mois,activation\nJuin,35\nJuillet,48\nAoût,62"),
    );
    const content =
      "import pandas as pd, matplotlib, os, socket\nmatplotlib.use('Agg')\nimport matplotlib.pyplot as plt\ndf=pd.read_csv('inputs/" +
      asset.id +
      "/metrics.csv')\ndf.plot(x='mois',y='activation',kind='bar').figure.savefig('outputs/activation.png')\ndf.to_csv('outputs/activation.csv',index=False)\nassert os.getuid()==10001\ntry:\n socket.create_connection(('1.1.1.1',443),timeout=1)\n raise RuntimeError('network enabled')\nexcept OSError: pass\nprint('ok')";
    const input = {
      key: "chart",
      title: "Analyse activation",
      runtime: "python",
      entrypoint: "main.py",
      files: [{ path: "main.py", content }],
      assetIds: [asset.id],
    };
    const result = await runCode(
      f.userId,
      f.conversationId,
      f.runId,
      input,
      new AbortController().signal,
    );
    expect(result.artifacts).toHaveLength(2);
    expect(result.stdout).toContain("ok");
    const retry = await runCode(
      f.userId,
      f.conversationId,
      f.runId,
      input,
      new AbortController().signal,
    );
    expect(retry.artifacts?.map((artifact) => artifact.id)).toEqual(
      result.artifacts?.map((artifact) => artifact.id),
    );
    const csv = result.artifacts!.find(
      (artifact) => artifact.format === "csv",
    )!;
    expect(
      JSON.stringify(
        await readSourceFile(f.userId, f.conversationId, f.runId, {
          assetId: csv.assetId,
        }),
      ),
    ).toContain("activation");
  },
  30000,
);
test.skipIf(!enabled)(
  "le worker refuse les chemins sortants et les changements d’une étape",
  async () => {
    const id = createHash("sha256").update(crypto.randomUUID()).digest("hex");
    await expect(
      workerRequest(id, "PUT", {
        runtime: "node",
        entrypoint: "../main.js",
        files: [{ path: "../main.js", data: "YQ==" }],
      }),
    ).rejects.toThrow("400");
  },
);
