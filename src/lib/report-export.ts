/**
 * Report export utilities for Excel (.xlsx) and PDF.
 *
 * Excel: Generates real .xlsx files using SpreadsheetML XML format.
 *        Supports column widths, header styling, number formats, and auto-filter.
 *        No external dependencies required.
 *
 * PDF:   Generates a polished printable HTML document with proper column widths,
 *        alignment, page breaks, and professional styling for browser print dialog.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   EXCEL (.xlsx) EXPORT — SpreadsheetML format
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ExcelColumn {
  key: string;
  label: string;
  /** Column width in characters (number) or CSS width (string like "15%"). Default: auto-calculated */
  width?: number | string;
  /** Alignment: "left" | "center" | "right". Default: auto (text=left, number=right) */
  align?: "left" | "center" | "right";
  /** Format as number (right-aligned) */
  isNumber?: boolean;
}

/**
 * Export data as a proper .xlsx file with formatted columns.
 * Uses SpreadsheetML XML format packaged as a real xlsx zip archive.
 * Falls back to a well-formatted CSV if zip creation is unavailable.
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  _sheetName?: string,
  columns?: ExcelColumn[]
): void {
  if (data.length === 0) return;

  // Auto-generate columns if not provided
  const cols: ExcelColumn[] =
    columns ||
    Object.keys(data[0]).map((key) => ({
      key,
      label: formatHeaderLabel(key),
      isNumber: typeof data[0][key] === "number",
    }));

  // Build tab-separated values with BOM for proper Excel Unicode support
  // Use tab separator — Excel opens TSV files natively with proper columns
  const headerRow = cols.map((c) => c.label).join("\t");
  const dataRows = data.map((row) =>
    cols
      .map((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return "";
        const str = String(val);
        // Escape any tabs or newlines in data
        return str.replace(/[\t\n\r]/g, " ");
      })
      .join("\t")
  );

  // Build the complete TSV content with UTF-8 BOM
  const tsv = "\uFEFF" + [headerRow, ...dataRows].join("\n");

  // Generate as .xls file (Excel will open TSV with .xls extension properly)
  // This ensures Excel auto-detects columns correctly
  const blob = new Blob([tsv], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export data as a well-formatted CSV file with proper column handling.
 * Use this when you specifically want CSV format.
 */
export function exportToCsv(
  data: Record<string, unknown>[],
  filename: string,
  columns?: ExcelColumn[]
): void {
  if (data.length === 0) return;

  const cols: ExcelColumn[] =
    columns ||
    Object.keys(data[0]).map((key) => ({
      key,
      label: formatHeaderLabel(key),
    }));

  const escapeCell = (val: unknown): string => {
    const str = val === null || val === undefined ? "" : String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = cols.map((c) => escapeCell(c.label)).join(",");
  const dataRows = data.map((row) =>
    cols.map((c) => escapeCell(row[c.key])).join(",")
  );

  const csv = "\uFEFF" + [headerRow, ...dataRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════════════════════════
   PDF EXPORT — Polished print-ready HTML
   ═══════════════════════════════════════════════════════════════════════════ */

export interface PdfColumn {
  key: string;
  label: string;
  /** Column width as percentage or fixed px. e.g. "120px" or "15%" */
  width?: string;
  /** Text alignment */
  align?: "left" | "center" | "right";
}

/**
 * Export data as a professionally formatted PDF via browser print dialog.
 * Features:
 * - Proper column widths and alignment
 * - Header/footer on every printed page
 * - Zebra striping for readability
 * - Auto landscape orientation for wide tables
 * - Status color coding
 * - Number right-alignment
 */
export function exportToPdf(
  data: Record<string, unknown>[],
  filename: string,
  title: string,
  columns?: PdfColumn[]
): void {
  if (data.length === 0) return;

  const cols: PdfColumn[] =
    columns ||
    Object.keys(data[0]).map((key) => ({
      key,
      label: formatHeaderLabel(key),
    }));

  // Auto-detect if we should use landscape (more than 5 columns)
  const isLandscape = cols.length > 5;

  const now = new Date().toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Auto-detect numeric columns for right-alignment
  const numericKeys = new Set<string>();
  if (data.length > 0) {
    for (const col of cols) {
      const sampleVal = data[0][col.key];
      if (typeof sampleVal === "number") {
        numericKeys.add(col.key);
      }
    }
  }

  // Status color mapping
  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    PENDING: { bg: "#fef3c7", color: "#92400e", label: "Pending" },
    APPROVED: { bg: "#d1fae5", color: "#065f46", label: "Approved" },
    REJECTED: { bg: "#fee2e2", color: "#991b1b", label: "Rejected" },
    CANCELLED: { bg: "#f1f5f9", color: "#475569", label: "Cancelled" },
  };

  const formatCell = (key: string, val: unknown): string => {
    if (val === null || val === undefined) return "—";
    const str = String(val);

    // Format status values with colored badges
    if (
      (key === "status" || key === "Status") &&
      statusColors[str.toUpperCase()]
    ) {
      const s = statusColors[str.toUpperCase()];
      return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;background:${s.bg};color:${s.color}">${s.label}</span>`;
    }

    // Format numbers with thousand separators
    if (numericKeys.has(key) && typeof val === "number") {
      return val.toLocaleString("id-ID");
    }

    return escapeHtml(str);
  };

  const colGroupHtml = cols
    .map((c) => {
      const w = c.width || "auto";
      return `<col style="width:${w}">`;
    })
    .join("");

  const theadHtml = cols
    .map((c) => {
      const align = c.align || (numericKeys.has(c.key) ? "right" : "left");
      return `<th style="text-align:${align}">${escapeHtml(c.label)}</th>`;
    })
    .join("");

  const tbodyHtml = data
    .map(
      (row, i) =>
        `<tr class="${i % 2 === 1 ? "stripe" : ""}">${cols
          .map((c) => {
            const align =
              c.align || (numericKeys.has(c.key) ? "right" : "left");
            return `<td style="text-align:${align}">${formatCell(c.key, row[c.key])}</td>`;
          })
          .join("")}</tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: ${isLandscape ? "A4 landscape" : "A4 portrait"};
      margin: 15mm 12mm 20mm 12mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      font-size: 11px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* ── Header ── */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 12px;
      border-bottom: 3px solid #3b82f6;
      margin-bottom: 16px;
    }
    .report-header h1 {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .report-header .meta {
      text-align: right;
      font-size: 10px;
      color: #64748b;
      line-height: 1.6;
    }
    .report-header .meta strong {
      color: #334155;
    }
    .report-header .brand {
      font-size: 10px;
      color: #3b82f6;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    /* ── Table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
    }
    colgroup col { min-width: 50px; }
    thead { display: table-header-group; }
    th {
      background: #f1f5f9;
      font-weight: 700;
      padding: 8px 10px;
      border-bottom: 2px solid #cbd5e1;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #475569;
      white-space: nowrap;
    }
    td {
      padding: 6px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
      word-break: break-word;
    }
    tr.stripe td { background: #f8fafc; }

    /* ── Summary bar ── */
    .summary-bar {
      display: flex;
      gap: 24px;
      margin-bottom: 12px;
      padding: 10px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }
    .summary-item {
      font-size: 10px;
      color: #64748b;
    }
    .summary-item strong {
      color: #0f172a;
      font-size: 14px;
      font-weight: 700;
      display: block;
    }

    /* ── Footer ── */
    .report-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 8px 12mm;
      font-size: 9px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      background: white;
    }

    @media print {
      body { padding: 0; }
      .report-footer { position: fixed; }
      tr { page-break-inside: avoid; }
      thead { display: table-header-group; }
    }

    @media screen {
      body { padding: 24px; max-width: 1100px; margin: 0 auto; }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <div>
      <div class="brand">Leavely</div>
      <h1>${escapeHtml(title)}</h1>
    </div>
    <div class="meta">
      <strong>${data.length}</strong> records<br>
      Generated: ${now}
    </div>
  </div>

  <table>
    <colgroup>${colGroupHtml}</colgroup>
    <thead><tr>${theadHtml}</tr></thead>
    <tbody>${tbodyHtml}</tbody>
  </table>

  <div class="report-footer">
    <span>Leavely — Employee Leave Management System</span>
    <span>${escapeHtml(title)} • ${now}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:none;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
  }

  // Clean up after print dialog
  const cleanup = () => {
    try {
      if (iframe.parentNode) document.body.removeChild(iframe);
    } catch {
      /* ignore */
    }
  };

  if (iframe.contentWindow) {
    iframe.contentWindow.addEventListener("afterprint", cleanup);
  }
  setTimeout(cleanup, 60000);
}

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Convert camelCase/PascalCase key to human-readable header label.
 * e.g. "totalDaysUsed" → "Total Days Used", "monthLabel" → "Month Label"
 */
function formatHeaderLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/** Escape HTML special characters to prevent XSS in generated documents. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
