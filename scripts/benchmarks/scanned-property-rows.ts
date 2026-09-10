import { valueFrom } from "../../packages/server/src/databases/value-from";
import { rows, values } from "./property-values-fixture";

// Baseline retained only for the benchmark: the former queryEntries algorithm.
export function scannedPropertyRows() {
  return rows.map((row) => ({
    ...row,
    values: Object.fromEntries(
      values
        .filter((value) => value.pageId === row.id)
        .map((value) => [
          value.propertyId,
          {
            value: valueFrom(value),
            revision: value.revision,
          },
        ]),
    ),
  }));
}
