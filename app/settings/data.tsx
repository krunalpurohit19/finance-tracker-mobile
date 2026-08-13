import { useState } from "react";
import { Platform, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { parseCsvObjects } from "@finance/domain";

import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Screen } from "../../src/components/Screen";
import { useImportPreview, useSettings } from "../../src/features/settings/queries";
import { API_BASE_URL, getSessionToken } from "../../src/lib/auth-client";
import { useTheme } from "../../src/theme/tokens";

type Status = { kind: "idle" } | { kind: "busy" } | { kind: "error"; message: string };

/**
 * Column aliases.
 *
 * Our own export writes `base_amount`; a bank writes "Date" and "Description".
 * `parseCsvObjects` already strips case, spaces and underscores, so this maps
 * what is left onto the field names the import schema expects. Anything not
 * listed passes through untouched.
 */
const COLUMN_ALIASES: Record<string, string> = {
  date: "occurredOn",
  occurredon: "occurredOn",
  transactiondate: "occurredOn",
  description: "merchant",
  payee: "merchant",
  transferaccount: "transferAccount",
  note: "notes",
};

export default function DataScreen() {
  const theme = useTheme();
  const settings = useSettings();
  const preview = useImportPreview();

  const [exportStatus, setExportStatus] = useState<Status>({ kind: "idle" });
  const [importStatus, setImportStatus] = useState<Status>({ kind: "idle" });

  /**
   * Fetch the export and hand it to the OS share sheet.
   *
   * Written into the cache directory rather than documents: it is a copy the
   * user is about to send somewhere, not app state, and the system is welcome
   * to reclaim it.
   */
  async function onExport(format: "csv" | "json") {
    setExportStatus({ kind: "busy" });
    try {
      const url = new URL(`${API_BASE_URL}/api/v1/settings/export`);
      url.searchParams.set("format", format);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${getSessionToken() || ""}` },
      });
      if (!response.ok) throw new Error(`The server returned ${response.status}.`);

      const body = await response.text();
      const today = new Date().toISOString().slice(0, 10);
      const file = new File(Paths.cache, `finance-${today}.${format}`);

      if (file.exists) file.delete();
      file.create();
      file.write(body);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: format === "csv" ? "text/csv" : "application/json",
          dialogTitle: "Save your finance export",
        });
      } else {
        throw new Error(`Sharing isn't available on this device. The file is at ${file.uri}.`);
      }

      setExportStatus({ kind: "idle" });
    } catch (error) {
      setExportStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "The export failed.",
      });
    }
  }

  async function onPickImport() {
    setImportStatus({ kind: "busy" });
    preview.reset();
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "text/plain"],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets[0]) {
        setImportStatus({ kind: "idle" });
        return;
      }

      const text = await new File(picked.assets[0].uri).text();
      const rows = parseCsvObjects(text).map((row) => {
        const mapped: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(row)) {
          mapped[COLUMN_ALIASES[key] ?? key] = value;
        }
        return mapped;
      });

      if (rows.length === 0) {
        setImportStatus({ kind: "error", message: "That file has no rows under its header." });
        return;
      }

      preview.mutate(rows.slice(0, 5000));
      setImportStatus({ kind: "idle" });
    } catch (error) {
      setImportStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Couldn't read that file.",
      });
    }
  }

  const counts = settings.data?.counts;

  return (
    <Screen>
      <Card eyebrow="Take it with you" title="Export">
        <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 20 }}>
          Your data is yours. The CSV is the ledger — every transaction, with amounts as exact
          decimals rather than rounded display values. The JSON is everything: accounts,
          categories, budgets, goals, recurring rules and exchange rates too.
        </Text>

        {counts ? (
          <Text style={{ color: theme.textSubtle, fontSize: 13 }}>
            {counts.transactions} transactions · {counts.accounts} accounts ·{" "}
            {counts.categories} categories · {counts.budgets} budgets · {counts.goals} goals
          </Text>
        ) : null}

        <View style={{ gap: 8 }}>
          <Button
            label="Export ledger as CSV"
            onPress={() => void onExport("csv")}
            loading={exportStatus.kind === "busy"}
          />
          <Button
            label="Export everything as JSON"
            variant="secondary"
            onPress={() => void onExport("json")}
            loading={exportStatus.kind === "busy"}
          />
        </View>

        {exportStatus.kind === "error" ? (
          <Text style={{ color: theme.expense, fontSize: 13 }}>{exportStatus.message}</Text>
        ) : null}
      </Card>

      <Card eyebrow="Check before you commit" title="Import (dry run)">
        <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 20 }}>
          Pick a CSV and this reports exactly what would happen — which rows are valid, which
          accounts and categories it doesn&apos;t recognise, and which rows look like something
          you have already recorded.
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: 10,
            padding: 12,
            borderRadius: 12,
            backgroundColor: theme.surfaceElevated,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <Ionicons name="information-circle-outline" size={19} color={theme.textMuted} />
          <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19, flex: 1 }}>
            Nothing is written. This build ships the checker, not the writer — an importer that
            half-works would quietly mangle years of history, and the damage would surface
            months later as a total that looks slightly wrong.
          </Text>
        </View>

        <Button
          label="Choose a CSV to check"
          variant="secondary"
          onPress={() => void onPickImport()}
          loading={importStatus.kind === "busy" || preview.isPending}
        />

        {importStatus.kind === "error" ? (
          <Text style={{ color: theme.expense, fontSize: 13 }}>{importStatus.message}</Text>
        ) : null}

        {preview.isError ? (
          <Text style={{ color: theme.expense, fontSize: 13 }}>
            {preview.error instanceof Error ? preview.error.message : "The check failed."}
          </Text>
        ) : null}

        {preview.data ? <PreviewReport data={preview.data} /> : null}
      </Card>

      {Platform.OS === "web" ? (
        <Text style={{ color: theme.textSubtle, fontSize: 12 }}>
          File sharing needs a device or simulator; it is unavailable in a browser.
        </Text>
      ) : null}
    </Screen>
  );
}

function PreviewReport({
  data,
}: {
  data: {
    totalRows: number;
    valid: number;
    invalid: number;
    issues: { row: number; field: string; message: string }[];
    unknownAccounts: string[];
    unknownCategories: string[];
    possibleDuplicates: number[];
  };
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: 10, paddingTop: 4 }}>
      <View style={{ flexDirection: "row", gap: 16 }}>
        <Figure label="Rows" value={String(data.totalRows)} />
        <Figure label="Would import" value={String(data.valid)} />
        <Figure label="Would fail" value={String(data.invalid)} />
      </View>

      {data.unknownAccounts.length > 0 ? (
        <Note
          icon="wallet-outline"
          text={`Accounts not found: ${data.unknownAccounts.join(", ")}. Create them first, or rename the column values to match.`}
        />
      ) : null}

      {data.unknownCategories.length > 0 ? (
        <Note
          icon="pricetag-outline"
          text={`Categories not found: ${data.unknownCategories.join(", ")}.`}
        />
      ) : null}

      {data.possibleDuplicates.length > 0 ? (
        <Note
          icon="copy-outline"
          text={`${data.possibleDuplicates.length} row${
            data.possibleDuplicates.length === 1 ? "" : "s"
          } match something already recorded (rows ${data.possibleDuplicates
            .slice(0, 8)
            .join(
              ", ",
            )}). Flagged, not skipped — two identical coffees in one day is ordinary.`}
        />
      ) : null}

      {data.issues.length > 0 ? (
        <View style={{ gap: 6 }}>
          <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600" }}>
            First {Math.min(data.issues.length, 10)} problems
          </Text>
          {data.issues.slice(0, 10).map((issue, index) => (
            <Text
              key={`${issue.row}-${issue.field}-${index}`}
              style={{ color: theme.textSubtle, fontSize: 13 }}
            >
              Row {issue.row} · {issue.field}: {issue.message}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <Text
        style={{
          color: theme.text,
          fontSize: 20,
          fontWeight: "700",
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
      <Text style={{ color: theme.textSubtle, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function Note({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Ionicons name={icon} size={16} color={theme.warning} />
      <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19, flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}
