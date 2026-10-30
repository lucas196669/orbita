import { buildCsv, escapeCsv, type ExportColumn } from './export.service';

interface Row {
  readonly name: string;
  readonly total: number;
}

const columns: readonly ExportColumn<Row>[] = [
  { header: 'Producto', value: (row) => row.name },
  { header: 'Total', value: (row) => row.total },
];

describe('escapeCsv', () => {
  it('returns an empty string for empty values', () => {
    expect(escapeCsv(null)).toBe('');
    expect(escapeCsv(undefined)).toBe('');
  });

  it('uses a comma as decimal separator for numbers', () => {
    expect(escapeCsv(12.5)).toBe('12,5');
    expect(escapeCsv(12)).toBe('12');
  });

  it('quotes cells containing the separator, quotes or line breaks', () => {
    expect(escapeCsv('a;b')).toBe('"a;b"');
    expect(escapeCsv('a"b')).toBe('"a""b"');
    expect(escapeCsv('a\nb')).toBe('"a\nb"');
  });

  it('neutralizes spreadsheet formulas', () => {
    expect(escapeCsv('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(escapeCsv('+1+1')).toBe("'+1+1");
    expect(escapeCsv('-2+3')).toBe("'-2+3");
    expect(escapeCsv('@import')).toBe("'@import");
  });
});

describe('buildCsv', () => {
  it('adds a UTF-8 BOM, a semicolon header and escaped rows', () => {
    const csv = buildCsv(columns, [
      { name: 'Teclado; mecánico', total: 99.9 },
      { name: '=Peligro', total: 10 },
    ]);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('Producto;Total');
    expect(csv).toContain('"Teclado; mecánico";99,9');
    expect(csv).toContain("'=Peligro;10");
    expect(csv.endsWith('\r\n')).toBe(true);
  });
});
