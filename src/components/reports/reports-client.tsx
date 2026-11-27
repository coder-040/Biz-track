"use client";

import { useMemo, useState } from "react";
import { DownloadIcon, FileSpreadsheetIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/format";
import {
  buildReport,
  REPORT_OPTIONS,
  type CellValue,
  type ReportColumn,
  type ReportFormat,
  type ReportType,
} from "@/lib/reports/build";
import type { ReportSources } from "@/lib/reports/data";

function monthStart(today: string): string {
  return `${today.slice(0, 7)}-01`;
}

function formatValue(value: CellValue, format: ReportFormat): string {
  if (value === null || value === "") return "—";
  if (format === "currency") return formatCurrency(Number(value));
  if (format === "quantity") return formatQuantity(Number(value));
  if (format === "date") return formatDate(String(value));
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function exportCell(value: CellValue): string {
  if (value === null) return "";
  if (typeof value !== "string") return String(value);
  return /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
}

function csvEscape(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportRows(
  columns: ReportColumn[],
  rows: Array<Record<string, CellValue>>,
  summaries: Array<{ label: string; value: number }>,
): CellValue[][] {
  const data: CellValue[][] = [
    columns.map((column) => column.label),
    ...rows.map((row) => columns.map((column) => row[column.key])),
  ];

  if (summaries.length > 0) {
    data.push([]);
    data.push(["Totals"]);
    data.push(...summaries.map((summary) => [summary.label, summary.value]));
  }

  return data;
}

function downloadCsv(
  title: string,
  columns: ReportColumn[],
  rows: Array<Record<string, CellValue>>,
  summaries: Array<{ label: string; value: number }>,
) {
  const content = exportRows(columns, rows, summaries)
    .map((row) => row.map((value) => csvEscape(exportCell(value))).join(","))
    .join("\r\n");
  downloadFile(`\uFEFF${content}`, `${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}.csv`, "text/csv;charset=utf-8");
}

function downloadExcel(
  title: string,
  columns: ReportColumn[],
  rows: Array<Record<string, CellValue>>,
  summaries: Array<{ label: string; value: number }>,
) {
  const content = exportRows(columns, rows, summaries)
    .map((row) => {
      const cells = row
        .map((value) => {
          const numeric = typeof value === "number" && Number.isFinite(value);
          const type = numeric ? "Number" : "String";
          const safeValue = numeric
            ? String(value)
            : xmlEscape(exportCell(value));
          return `<Cell><Data ss:Type="${type}">${safeValue}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");
  const workbook = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="${xmlEscape(title.slice(0, 31))}"><Table>${content}</Table></Worksheet></Workbook>`;
  downloadFile(
    workbook,
    `${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}.xls`,
    "application/vnd.ms-excel;charset=utf-8",
  );
}

function ReportTable({
  columns,
  rows,
}: {
  columns: ReportColumn[];
  rows: Array<Record<string, CellValue>>;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-170 border-collapse text-left text-sm">
        <thead className="bg-muted/60 text-xs text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="px-4 py-3 font-medium">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, index) => (
            <tr key={index} className="bg-card">
              {columns.map((column) => (
                <td key={column.key} className="max-w-72 px-4 py-3 align-top">
                  <span className="block truncate">
                    {formatValue(row[column.key], column.format)}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReportsClient({
  sources,
  today,
}: {
  sources: ReportSources;
  today: string;
}) {
  const [type, setType] = useState<ReportType>("daily-income-expense");
  const [from, setFrom] = useState(() => monthStart(today));
  const [to, setTo] = useState(today);
  const invalidRange = Boolean(from && to && from > to);
  const report = useMemo(
    () => buildReport(sources, type, from, to),
    [sources, type, from, to],
  );

  function exportCsv() {
    downloadCsv(report.title, report.columns, report.rows, report.summaries);
    toast.success(
      `Exported ${report.rows.length} ${report.rows.length === 1 ? "row" : "rows"} to CSV.`,
    );
  }

  function exportExcel() {
    downloadExcel(report.title, report.columns, report.rows, report.summaries);
    toast.success(
      `Exported ${report.rows.length} ${report.rows.length === 1 ? "row" : "rows"} to Excel.`,
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.4fr)_1fr_1fr_auto] lg:items-end">
          <div className="grid gap-2">
            <Label htmlFor="report-type">Report</Label>
            <select
              id="report-type"
              value={type}
              onChange={(event) => setType(event.target.value as ReportType)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {REPORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="report-from">From</Label>
            <Input
              id="report-from"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="report-to">To</Label>
            <Input
              id="report-to"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={exportCsv} disabled={invalidRange}>
              <DownloadIcon aria-hidden="true" /> CSV
            </Button>
            <Button type="button" onClick={exportExcel} disabled={invalidRange}>
              <FileSpreadsheetIcon aria-hidden="true" /> Excel
            </Button>
          </div>
        </div>
        {invalidRange ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            The start date must be on or before the end date.
          </p>
        ) : null}
      </section>

      {!invalidRange ? (
        <>
          <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{report.title}</h2>
              <p className="text-sm text-muted-foreground">{report.description}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {report.rows.length} {report.rows.length === 1 ? "row" : "rows"}
            </p>
          </header>

          <section aria-label="Report totals" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {report.summaries.map((summary) => (
              <div key={summary.label} className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">{summary.label}</p>
                <p className="mt-1 text-xl font-semibold">
                  {formatValue(summary.value, summary.format)}
                </p>
              </div>
            ))}
          </section>

          {report.rows.length > 0 ? (
            <ReportTable columns={report.columns} rows={report.rows} />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <p className="font-medium">No records for this report</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try another report or widen the selected date range.
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
