export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName?: string
): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const titleHeaders = headers.map((h) =>
    h.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim()
  );

  const escapeCell = (val: unknown): string => {
    const str = val === null || val === undefined ? "" : String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = data.map((row) =>
    headers.map((h) => escapeCell(row[h])).join(",")
  );

  const csv = "\uFEFF" + [titleHeaders.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToPdf(
  data: Record<string, unknown>[],
  filename: string,
  title: string,
  columns?: { key: string; label: string }[]
): void {
  if (data.length === 0) return;

  const cols = columns || Object.keys(data[0]).map((key) => ({
    key,
    label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim(),
  }));

  const now = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #1a1a2e; }
        h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        .subtitle { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f8fafc; font-weight: 600; text-align: left; padding: 10px 12px; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; color: #64748b; }
        td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
        tr:nth-child(even) td { background: #fafbfc; }
        tr:hover td { background: #f0f4ff; }
        .footer { margin-top: 20px; font-size: 10px; color: #9ca3af; text-align: center; }
        @media print {
          body { padding: 0; }
          tr:hover td { background: inherit; }
          tr:nth-child(even) td { background: #fafbfc; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="subtitle">Generated on ${now} • ${data.length} records</p>
      <table>
        <thead><tr>${cols.map((c) => `<th>${c.label}</th>`).join("")}</tr></thead>
        <tbody>${data.map((row) => `<tr>${cols.map((c) => `<td>${row[c.key] ?? "—"}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
      <p class="footer">Leave Management System Report</p>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
  }

  // Clean up after print
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 5000);
}
