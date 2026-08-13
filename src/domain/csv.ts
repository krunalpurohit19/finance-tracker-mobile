/**
 * CSV, per RFC 4180, in both directions.
 *
 * Escaping and parsing live in one module — and in the domain package, which
 * both the API and the app can import — because they are inverses. Keeping
 * them together is what makes "export then re-import returns what you started
 * with" a property a test can actually assert, rather than two implementations
 * that agree until one of them is edited.
 *
 * Deliberately dependency-free. A CSV library would be a reasonable choice in
 * isolation; it is not worth a runtime dependency in a React Native bundle for
 * two functions whose entire specification is one short RFC.
 */

/** Characters that force a field to be quoted. */
const NEEDS_QUOTING = /[",\n\r]/;

/**
 * Spreadsheet formula injection guard.
 *
 * Excel, Sheets and Numbers all execute a cell beginning with one of these.
 * A merchant literally named `=cmd|'/c calc'!A0` is data, not a program, so
 * the field is prefixed with a tab — which every spreadsheet strips on
 * display but which stops the formula parser dead.
 */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

export function csvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";

  const guarded = FORMULA_LEAD.test(value) ? `\t${value}` : value;

  return NEEDS_QUOTING.test(guarded) ? `"${guarded.replaceAll('"', '""')}"` : guarded;
}

export function csvRow(fields: readonly (string | null | undefined)[]): string {
  return fields.map(csvField).join(",");
}

/**
 * Parse CSV text into rows of raw strings.
 *
 * A hand-rolled state machine rather than `split(",")`, because splitting is
 * wrong the moment a field contains a comma — and a notes field containing a
 * comma is not an edge case, it is Tuesday. Handles quoted fields, doubled
 * quotes inside them, embedded newlines, and CRLF.
 *
 * The leading tab written by `csvField` is stripped back off, so a value that
 * survived the formula guard round-trips to exactly what it was.
 */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  /**
   * Undo the injection guard, and only that.
   *
   * A leading tab is dropped only when the character behind it is itself a
   * formula lead — which is exactly the shape `csvField` produces and nothing
   * else. Keying off "was this field quoted" would be wrong: `=SUM(A1,B1)`
   * gets both the guard AND quotes, because it also contains a comma.
   *
   * A third-party file whose field genuinely begins with a tab followed by an
   * ordinary character keeps its tab.
   */
  const unguard = (value: string): string =>
    value.startsWith("\t") && FORMULA_LEAD.test(value.slice(1)) ? value.slice(1) : value;

  const endField = () => {
    row.push(unguard(field));
    field = "";
  };

  const endRow = () => {
    endField();
    // A trailing newline produces one empty trailing field, not a blank row.
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]!;

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1; // Consume the escaped pair.
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field === "") {
      inQuotes = true;
    } else if (char === ",") {
      endField();
    } else if (char === "\n") {
      endRow();
    } else if (char === "\r") {
      // CRLF: the \n that follows does the work. A lone \r also ends a row.
      if (text[i + 1] === "\n") continue;
      endRow();
    } else {
      field += char;
    }
  }

  // A file not ending in a newline still has a final row.
  if (field !== "" || row.length > 0) endRow();

  return rows;
}

/**
 * Parse CSV text into objects keyed by the header row.
 *
 * Headers are lowercased and underscores become nothing, so `base_amount`,
 * `Base Amount` and `baseAmount` all address the same column — an export from
 * a bank will not match our own header casing, and rejecting a file over that
 * would be pedantry rather than validation.
 */
export function parseCsvObjects(text: string): Record<string, string>[] {
  const rows = parseCsvRows(text);
  const [header, ...body] = rows;
  if (!header) return [];

  const keys = header.map((name) => normaliseHeader(name));

  return body.map((row) => {
    const record: Record<string, string> = {};
    keys.forEach((key, index) => {
      if (key) record[key] = row[index] ?? "";
    });
    return record;
  });
}

export function normaliseHeader(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replaceAll(/[\s_-]+/g, "");
}
