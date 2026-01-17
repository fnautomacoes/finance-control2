// Utility functions for export and print

/**
 * Export data to CSV file
 */
export function exportToCSV(data: Record<string, any>[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(";"),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle values that might contain semicolons or quotes
          if (typeof value === "string" && (value.includes(";") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? "";
        })
        .join(";")
    ),
  ].join("\n");

  // Add BOM for Excel UTF-8 compatibility
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Print current page content
 */
export function printPage(): void {
  window.print();
}

/**
 * Toggle fullscreen mode for an element
 */
export function toggleFullscreen(element?: HTMLElement | null): void {
  const targetElement = element || document.documentElement;

  if (!document.fullscreenElement) {
    targetElement.requestFullscreen?.().catch((err) => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen?.();
  }
}

/**
 * Format currency for export
 */
export function formatCurrencyForExport(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR");
}
