import { deepStrictEqual } from "node:assert";
import { indexedPropertyRows } from "./benchmarks/indexed-property-rows";
import { scannedPropertyRows } from "./benchmarks/scanned-property-rows";
import { measureOperation } from "./benchmarks/measure-operation";
import { rows, values } from "./benchmarks/property-values-fixture";

deepStrictEqual(indexedPropertyRows(), scannedPropertyRows());
const before = measureOperation(scannedPropertyRows);
const after = measureOperation(indexedPropertyRows);

console.log(
  JSON.stringify(
    {
      date: new Date().toISOString(),
      runtime: process.version,
      scope:
        "Construction en mémoire des réponses de table ; hors SQL, réseau et rendu React",
      rows: rows.length,
      propertiesPerRow: 100,
      values: values.length,
      samples: 30,
      equivalent: true,
      before,
      after,
      medianSpeedup: Number((before.p50ms / after.p50ms).toFixed(2)),
    },
    null,
    2,
  ),
);
