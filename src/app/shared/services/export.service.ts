import { Injectable } from '@angular/core';
import type { jsPDF } from 'jspdf';

/** Columna de un informe exportable. */
export interface ExportColumn<T> {
  /** Texto visible de la cabecera. */
  readonly header: string;
  /** Obtiene el valor de una fila. */
  readonly value: (row: T) => string | number | null | undefined;
}

/** Filtro aplicado al informe, mostrado en la cabecera del PDF. */
export interface ExportFilter {
  /** Nombre del filtro. */
  readonly label: string;
  /** Valor legible. */
  readonly value: string;
}

/** Opciones del informe PDF. */
export interface PdfExportOptions<T> {
  /** Nombre del archivo sin extensión o con `.pdf`. */
  readonly filename: string;
  /** Título del informe. */
  readonly title: string;
  /** Subtítulo opcional. */
  readonly subtitle?: string;
  /** Columnas de la tabla. */
  readonly columns: readonly ExportColumn<T>[];
  /** Filas que se exportan. */
  readonly rows: readonly T[];
  /** Filtros activos que se muestran en la cabecera. */
  readonly filters?: readonly ExportFilter[];
  /** Persona que genera el informe. */
  readonly generatedBy?: string;
  /** Color de acento del sistema de diseño. */
  readonly accentColor?: string;
  /** Color de texto sobre el acento. */
  readonly accentTextColor?: string;
}

const DEFAULT_ACCENT = '#c6f24e';
const DEFAULT_ACCENT_TEXT = '#0a0c11';
const PAGE_MARGIN = 14;

/**
 * Exportación de informes a CSV y PDF.
 *
 * El CSV usa BOM UTF-8 y separador `;` para facilitar su apertura en Excel en
 * español. El PDF se genera con jsPDF y jspdf-autotable, ambos importados de
 * forma diferida para no engordar el bundle inicial.
 */
@Injectable({ providedIn: 'root' })
export class ExportService {
  /**
   * Exporta filas a un archivo CSV.
   *
   * @param filename Nombre del archivo.
   * @param columns Columnas del informe.
   * @param rows Filas que se exportan.
   */
  exportCsv<T>(filename: string, columns: readonly ExportColumn<T>[], rows: readonly T[]): void {
    const content = buildCsv(columns, rows);
    this.download(withExtension(filename, 'csv'), content, 'text/csv;charset=utf-8');
  }

  /**
   * Exporta un informe a PDF con cabecera, filtros, tabla y paginación.
   *
   * @param options Configuración del informe.
   */
  async exportPdf<T>(options: PdfExportOptions<T>): Promise<void> {
    const [{ jsPDF: JsPdf }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

    const doc = new JsPdf({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const accent = options.accentColor ?? DEFAULT_ACCENT;
    const accentText = options.accentTextColor ?? DEFAULT_ACCENT_TEXT;
    const generatedAt = new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date());
    const filters = (options.filters ?? []).map((filter) => `${filter.label}: ${filter.value}`);
    const subtitle = [options.subtitle, ...filters].filter(Boolean).join(' · ');
    const headerHeight = drawReportHeader(doc, options.title, subtitle, generatedAt, accent, accentText, 1);

    autoTable(doc, {
      head: [options.columns.map((column) => column.header)],
      body: options.rows.map((row) => options.columns.map((column) => toCell(column.value(row)))),
      startY: headerHeight,
      margin: { top: PAGE_MARGIN, right: PAGE_MARGIN, bottom: 20, left: PAGE_MARGIN },
      theme: 'striped',
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        cellPadding: 2.6,
        textColor: [32, 36, 44],
        lineColor: [222, 226, 234],
        lineWidth: 0.1,
        valign: 'middle',
      },
      headStyles: {
        fillColor: hexToRgb(accent),
        textColor: hexToRgb(accentText),
        fontStyle: 'bold',
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [247, 248, 250],
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawReportHeader(doc, options.title, subtitle, generatedAt, accent, accentText, data.pageNumber);
        }
      },
    });

    const totalPages = doc.getNumberOfPages();

    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      drawReportFooter(doc, options.generatedBy, page, totalPages);
    }

    doc.save(withExtension(options.filename, 'pdf'));
  }

  private download(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}

/**
 * Construye el contenido CSV con BOM UTF-8 y separador `;`.
 *
 * @param columns Columnas del informe.
 * @param rows Filas que se exportan.
 * @returns Texto CSV listo para descargar.
 */
export function buildCsv<T>(columns: readonly ExportColumn<T>[], rows: readonly T[]): string {
  const header = columns.map((column) => escapeCsv(column.header)).join(';');
  const body = rows.map((row) => columns.map((column) => escapeCsv(column.value(row))).join(';'));
  const lines = [header, ...body].join('\r\n');

  return `\uFEFF${lines}\r\n`;
}

/**
 * Escapa una celda CSV y neutraliza fórmulas peligrosas.
 *
 * @param value Valor original.
 * @returns Celda segura.
 */
export function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const text = typeof value === 'number' ? formatNumber(value) : neutralizeFormula(value);
  const mustQuote = /[;"\r\n]/.test(text);

  return mustQuote ? `"${text.replace(/"/g, '""')}"` : text;
}

function neutralizeFormula(value: string): string {
  const trimmed = value.trimStart();

  return /^[=+\-@]/.test(trimmed) ? `'${value}` : value;
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return String(Math.round(value * 100) / 100).replace('.', ',');
}

function toCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  return typeof value === 'number' ? formatNumber(value) : value;
}

function withExtension(filename: string, extension: string): string {
  return filename.toLowerCase().endsWith(`.${extension}`) ? filename : `${filename}.${extension}`;
}

function drawReportHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  generatedAt: string,
  accent: string,
  accentText: string,
  page: number,
): number {
  const width = doc.internal.pageSize.getWidth();

  if (page === 1) {
    doc.setFillColor(...hexToRgb(accent));
    doc.roundedRect(PAGE_MARGIN, PAGE_MARGIN, 3.5, 16, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...hexToRgb(accentText));
    doc.setTextColor(20, 24, 31);
    doc.text('Orbita', PAGE_MARGIN + 7, PAGE_MARGIN + 7);
    doc.setFontSize(13);
    doc.text(title, PAGE_MARGIN + 7, PAGE_MARGIN + 14);

    let cursor = PAGE_MARGIN + 22;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(96, 103, 115);

    if (subtitle) {
      const lines = doc.splitTextToSize(subtitle, width - PAGE_MARGIN * 2 - 7) as string[];
      doc.text(lines, PAGE_MARGIN + 7, cursor);
      cursor += lines.length * 4;
    }

    doc.text(`Generado el ${generatedAt}`, PAGE_MARGIN + 7, cursor);
    cursor += 4;
    doc.setDrawColor(222, 226, 234);
    doc.setLineWidth(0.3);
    doc.line(PAGE_MARGIN, cursor + 2, width - PAGE_MARGIN, cursor + 2);

    return cursor + 8;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 24, 31);
  doc.text('Orbita', PAGE_MARGIN, PAGE_MARGIN + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(96, 103, 115);
  doc.text(title, PAGE_MARGIN + 18, PAGE_MARGIN + 4);
  doc.setDrawColor(222, 226, 234);
  doc.setLineWidth(0.2);
  doc.line(PAGE_MARGIN, PAGE_MARGIN + 8, width - PAGE_MARGIN, PAGE_MARGIN + 8);

  return PAGE_MARGIN + 13;
}

function drawReportFooter(doc: jsPDF, generatedBy: string | undefined, page: number, totalPages: number): void {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const text = generatedBy ? `Generado por ${generatedBy}` : 'Orbita';

  doc.setDrawColor(222, 226, 234);
  doc.setLineWidth(0.2);
  doc.line(PAGE_MARGIN, height - 14, width - PAGE_MARGIN, height - 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(110, 117, 128);
  doc.text(text, PAGE_MARGIN, height - 9);
  doc.text(`Página ${page} de ${totalPages}`, width - PAGE_MARGIN, height - 9, { align: 'right' });
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((part) => part + part)
          .join('')
      : normalized;

  if (full.length !== 6) {
    return [198, 242, 78];
  }

  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}
