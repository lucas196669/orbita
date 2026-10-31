import { TestBed, tick, type ComponentFixture } from '@angular/core/testing';

import { fakeAsyncTest } from '../../../../test-utils/fake-async';

import { DataTableComponent } from './data-table.component';
import type { RowAction, TableColumn } from './data-table.model';

type Person = {
  id: number;
  name: string;
  role: string;
  salary: number;
  start: string;
};

type TableFixture = ComponentFixture<DataTableComponent<Person>>;

const rows: Person[] = [
  { id: 1, name: 'Zoe', role: 'Admin', salary: 3200, start: '2024-01-10' },
  { id: 2, name: 'Ada', role: 'Editor', salary: 2400, start: '2023-05-02' },
  { id: 3, name: 'Bob', role: 'Viewer', salary: 1800, start: '2022-11-20' },
];

const columns: TableColumn<Person>[] = [
  { key: 'name', header: 'Nombre', sortable: true },
  { key: 'role', header: 'Rol', format: 'badge' },
  { key: 'salary', header: 'Salario', format: 'currency', align: 'end' },
  { key: 'start', header: 'Alta', format: 'date' },
];

function createTable(
  options: {
    data?: readonly Person[];
    pageSize?: number;
    searchable?: boolean;
    selectable?: boolean;
    rowActions?: readonly RowAction[];
    emptyMessage?: string;
  } = {},
): TableFixture {
  const fixture = TestBed.createComponent<DataTableComponent<Person>>(DataTableComponent);

  fixture.componentRef.setInput('data', options.data ?? rows);
  fixture.componentRef.setInput('columns', columns);
  fixture.componentRef.setInput('caption', 'Personas del equipo');
  fixture.componentRef.setInput('pageSize', options.pageSize ?? 10);
  fixture.componentRef.setInput('searchable', options.searchable ?? false);
  fixture.componentRef.setInput('selectable', options.selectable ?? false);
  fixture.componentRef.setInput('rowActions', options.rowActions ?? []);
  fixture.componentRef.setInput('emptyMessage', options.emptyMessage ?? 'No hay personas.');

  fixture.detectChanges();

  return fixture;
}

function visibleRows(fixture: TableFixture): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('tbody tr.data-table__row'));
}

describe('DataTableComponent', () => {
  it('renders the caption and formatted cells', () => {
    const fixture = createTable();

    expect(fixture.nativeElement.querySelector('caption').textContent).toContain('Personas del equipo');
    expect(fixture.nativeElement.textContent).toContain('3200,00');
    expect(fixture.nativeElement.querySelectorAll('.data-table__badge').length).toBe(3);

    fixture.destroy();
  });

  it('shows the empty state when there is no data', () => {
    const fixture = createTable({ data: [] });

    expect(fixture.nativeElement.querySelector('.data-table__empty').textContent).toContain('No hay personas.');

    fixture.destroy();
  });

  it(
    'filters rows by any visible column with a 300 ms debounce',
    fakeAsyncTest(() => {
      const fixture = createTable({ searchable: true });
      const emitted: string[] = [];
      fixture.componentInstance.searchChange.subscribe((term) => emitted.push(term));

      const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="search"]');
      input.value = 'ada';
      input.dispatchEvent(new Event('input'));

      tick(299);
      fixture.detectChanges();
      expect(visibleRows(fixture).length).toBe(3);

      tick(1);
      fixture.detectChanges();

      expect(emitted).toEqual(['ada']);
      expect(visibleRows(fixture).length).toBe(1);
      expect(visibleRows(fixture)[0]?.textContent).toContain('Ada');

      fixture.destroy();
    }),
  );

  it('sorts by a sortable column and emits the state', () => {
    const fixture = createTable();
    const emitted: string[] = [];
    fixture.componentInstance.sortChange.subscribe((state) => emitted.push(`${state.key}:${state.direction}`));

    const sortButton: HTMLButtonElement = fixture.nativeElement.querySelector('button.data-table__sort');
    sortButton.click();
    fixture.detectChanges();

    expect(emitted).toEqual(['name:asc']);
    expect(visibleRows(fixture)[0]?.textContent).toContain('Ada');
    expect(fixture.nativeElement.querySelector('th[aria-sort="ascending"]')).not.toBeNull();

    sortButton.click();
    fixture.detectChanges();

    expect(emitted).toEqual(['name:asc', 'name:desc']);
    expect(visibleRows(fixture)[0]?.textContent).toContain('Zoe');

    fixture.destroy();
  });

  it('paginates rows and emits the selected page', () => {
    const fixture = createTable({ pageSize: 2 });
    const pages: number[] = [];
    fixture.componentInstance.pageChange.subscribe((page) => pages.push(page));

    expect(visibleRows(fixture).length).toBe(2);

    const next: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Página siguiente"]');
    next.click();
    fixture.detectChanges();

    expect(pages).toEqual([2]);
    expect(visibleRows(fixture).length).toBe(1);

    fixture.destroy();
  });

  it('selects rows and emits the selected collection', () => {
    const fixture = createTable({ selectable: true });
    const selected: Person[][] = [];
    fixture.componentInstance.selectionChange.subscribe((selection) => selected.push(selection as Person[]));

    const checkboxes: HTMLInputElement[] = Array.from(fixture.nativeElement.querySelectorAll('input[type="checkbox"]'));
    checkboxes[1]?.click();
    fixture.detectChanges();

    expect(selected.at(-1)?.map((row) => row.id)).toEqual([1]);

    checkboxes[0]?.click();
    fixture.detectChanges();

    expect(selected.at(-1)?.length).toBe(3);

    fixture.destroy();
  });

  it('emits rowSelected and actionTriggered', () => {
    const fixture = createTable({ rowActions: [{ id: 'edit', label: 'Editar' }] });
    const selectedRows: Person[] = [];
    const actions: string[] = [];

    fixture.componentInstance.rowSelected.subscribe((row) => selectedRows.push(row as Person));
    fixture.componentInstance.actionTriggered.subscribe((event) => actions.push(event.actionId));

    visibleRows(fixture)[0]?.click();
    fixture.detectChanges();

    const action: HTMLButtonElement = fixture.nativeElement.querySelector('button.data-table__action');
    action.click();
    fixture.detectChanges();

    expect(selectedRows).toHaveLength(1);
    expect(actions).toEqual(['edit']);

    fixture.destroy();
  });

  it('hace las filas focusables y etiqueta la región desplazable', () => {
    const fixture = createTable();
    const region = fixture.nativeElement.querySelector('[role="region"]');
    const row = visibleRows(fixture)[0];

    expect(region?.getAttribute('aria-label')).toContain('Personas del equipo');
    expect(row?.getAttribute('tabindex')).toBe('0');

    row?.focus();
    expect(document.activeElement).toBe(row);

    fixture.destroy();
  });

  it('activa la fila con Enter y Espacio, pero no desde controles internos', () => {
    const fixture = createTable({ rowActions: [{ id: 'edit', label: 'Editar' }] });
    const selectedRows: Person[] = [];
    fixture.componentInstance.rowSelected.subscribe((row) => selectedRows.push(row as Person));

    const row = visibleRows(fixture)[0];
    row?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    row?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

    expect(selectedRows.map((selected) => selected.id)).toEqual([1, 1]);

    const action: HTMLButtonElement = fixture.nativeElement.querySelector('button.data-table__action');
    action.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(selectedRows).toHaveLength(2);

    fixture.destroy();
  });

  it(
    'shows the no-results state after filtering',
    fakeAsyncTest(() => {
      const fixture = createTable({ searchable: true });
      const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="search"]');
      input.value = 'zzz';
      input.dispatchEvent(new Event('input'));

      tick(300);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.data-table__empty').textContent).toContain('No hay resultados');

      fixture.destroy();
    }),
  );
});
