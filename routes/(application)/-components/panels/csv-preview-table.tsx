import { propertyTypeLabels } from "@/routes/(application)/-components/database/property-types";
import {
  type Csv,
  csvPropertyTypes,
} from "@/routes/(application)/-lib/import/csv-archive";
import type { PropertyType } from "@/validators/databases";
/** First rows of a CSV with a type picker per column (the first column becomes the title). */
export function CsvPreviewTable({
  csv,
  onChange,
}: {
  csv: Csv;
  onChange: (csv: Csv) => void;
}) {
  const setType = (column: number, type: PropertyType) =>
    onChange({
      ...csv,
      types: csv.types.map((t, index) => (index === column ? type : t)),
    });
  return (
    <div className="database-table-scroll">
      <table className="database-table">
        <thead>
          <tr>
            {csv.headers.map((header, i) => (
              <th key={i}>
                {header}
                {i > 0 && (
                  <select
                    aria-label={`Type de ${header}`}
                    onChange={(e) => setType(i, e.target.value as PropertyType)}
                    value={csv.types[i]}
                  >
                    {csvPropertyTypes.map((t) => (
                      <option key={t} value={t}>
                        {propertyTypeLabels[t]}
                      </option>
                    ))}
                  </select>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {csv.rows.slice(0, 5).map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
