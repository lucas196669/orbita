import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { formatCellValue } from './cell-format';
import type {
  RowAction,
  SortState,
  TableActionEvent,
  TableCellContext,
  TableColumn,
  TableColumnAlign,
} from './data-table.model';
import { TableCellDirective } from './table-cell.directive';

let nextTableId = 0;

/**
 * Tabla de datos avanzada, reutilizable y agnóstica.
 *
 * No conoce servicios de datos, rutas ni roles: recibe filas, columnas y
 * acciones por inputs y comunica interacción por outputs. Filtra, ordena y
 * pagina en cliente, permite selección múltiple y transforma las filas en
 * tarjetas en pantallas estrechas.
 *
 * @typeParam T Tipo de fila. Debe ser un objeto.
 */
@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T extends object = Record<string, unknown>> {
  /** Filas que se muestran en la tabla. */
  readonly data = input<readonly T[]>([]);

  /** Columnas visibles y su configuración. */
  readonly columns = input.required<readonly TableColumn<T>[]>();

  /** Indica que los datos están cargándose. */
  readonly loading = input(false);

  /** Número de filas por página. */
  readonly pageSize = input(10);

  /** Activa el buscador integrado. */
  readonly searchable = input(false);

  /** Texto de ayuda del buscador. */
  readonly searchPlaceholder = input('Buscar…');

  /** Mensaje cuando no hay datos. */
  readonly emptyMessage = input('No hay datos disponibles.');

  /** Título accesible de la tabla. */
  readonly caption = input.required<string>();

  /** Activa la selección de filas con casillas. */
  readonly selectable = input(false);

  /** Acciones disponibles para cada fila. */
  readonly rowActions = input<readonly RowAction[]>([]);

  /** Se emite al hacer clic en una fila. */
  readonly rowSelected = output<T>();

  /** Se emite cuando cambia la selección de filas. */
  readonly selectionChange = output<T[]>();

  /** Se emite cuando cambia la ordenación. */
  readonly sortChange = output<SortState>();

  /** Se emite con el término de búsqueda (debounce de 300 ms). */
  readonly searchChange = output<string>();

  /** Se emite al cambiar de página. */
  readonly pageChange = output<number>();

  /** Se emite al activar una acción de fila. */
  readonly actionTriggered = output<TableActionEvent<T>>();

  /** Plantillas personalizadas declaradas por el consumidor. */
  readonly cellTemplates = contentChildren(TableCellDirective);

  private readonly destroyRef = inject(DestroyRef);
  private readonly tableRegion = viewChild<ElementRef<HTMLElement>>('tableRegion');

  private readonly searchTermState = signal('');
  private readonly searchInputState = signal('');
  private readonly sortState = signal<SortState | null>(null);
  private readonly requestedPage = signal(1);
  private readonly selectedKeys = signal<ReadonlySet<string>>(new Set());
  private readonly announcementState = signal('');
  private readonly generatedKeys = new WeakMap<object, string>();

  private generatedKeyCounter = 0;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private focusTimer: ReturnType<typeof setTimeout> | null = null;

  /** Identificador único de la tabla. */
  readonly tableId = `data-table-${nextTableId++}`;

  /** Identificador del buscador. */
  readonly searchId = `${this.tableId}-search`;

  /** Identificador de la leyenda. */
  readonly captionId = `${this.tableId}-caption`;

  /** Término de búsqueda aplicado. */
  readonly activeSearch = this.searchTermState.asReadonly();

  /** Valor actual del buscador. */
  readonly searchValue = this.searchInputState.asReadonly();

  /** Texto anunciado por la región aria-live. */
  readonly announcement = this.announcementState.asReadonly();

  /** Tamaño de página efectivo. */
  readonly effectivePageSize = computed(() => Math.max(1, Math.floor(this.pageSize())));

  /** Filas que pasan el filtro de búsqueda. */
  readonly filteredRows = computed<readonly T[]>(() => {
    const term = this.searchTermState().toLocaleLowerCase('es');

    if (!term) {
      return [...this.data()];
    }

    return this.data().filter((row) =>
      this.columns().some((column) => this.cellSearchText(row, column).includes(term)),
    );
  });

  /** Filas filtradas y ordenadas. */
  readonly sortedRows = computed<readonly T[]>(() => {
    const sort = this.sortState();
    const rows = [...this.filteredRows()];

    if (!sort) {
      return rows;
    }

    const column = this.columns().find((entry) => entry.key === sort.key);

    if (!column) {
      return rows;
    }

    const direction = sort.direction === 'asc' ? 1 : -1;

    return rows.sort((left, right) => this.compareRows(left, right, column) * direction);
  });

  /** Total de páginas disponibles. */
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sortedRows().length / this.effectivePageSize())),
  );

  /** Página actual, acotada al total de páginas. */
  readonly currentPage = computed(() => Math.min(this.requestedPage(), this.totalPages()));

  /** Filas de la página actual. */
  readonly pageRows = computed<readonly T[]>(() => {
    const start = (this.currentPage() - 1) * this.effectivePageSize();
    return this.sortedRows().slice(start, start + this.effectivePageSize());
  });

  /** Primera fila visible de la página. */
  readonly pageStart = computed(() =>
    this.sortedRows().length === 0 ? 0 : (this.currentPage() - 1) * this.effectivePageSize() + 1,
  );

  /** Última fila visible de la página. */
  readonly pageEnd = computed(() =>
    Math.min(this.currentPage() * this.effectivePageSize(), this.sortedRows().length),
  );

  /** No hay datos que mostrar. */
  readonly isEmpty = computed(() => !this.loading() && this.data().length === 0);

  /** Hay datos, pero el filtro no devuelve resultados. */
  readonly noResults = computed(
    () => !this.loading() && this.data().length > 0 && this.filteredRows().length === 0,
  );

  /** Debe mostrarse la paginación. */
  readonly showPagination = computed(
    () => !this.loading() && this.sortedRows().length > this.effectivePageSize(),
  );

  /** Todas las filas de la página están seleccionadas. */
  readonly allPageSelected = computed(() => {
    const rows = this.pageRows();
    return rows.length > 0 && rows.every((row) => this.isSelected(row));
  });

  /** Algunas filas de la página están seleccionadas. */
  readonly somePageSelected = computed(
    () => !this.allPageSelected() && this.pageRows().some((row) => this.isSelected(row)),
  );

  /** Filas seleccionadas actualmente. */
  readonly selectedRows = computed<readonly T[]>(() => {
    const keys = this.selectedKeys();
    return this.data().filter((row) => keys.has(this.rowKey(row)));
  });

  /** Número de columnas incluyendo selección y acciones. */
  readonly colspan = computed(
    () => this.columns().length + (this.selectable() ? 1 : 0) + (this.rowActions().length > 0 ? 1 : 0),
  );

  /** Filas de esqueleto para el estado de carga. */
  readonly skeletonRows = computed(() =>
    Array.from({ length: Math.min(this.effectivePageSize(), 5) }, (_, index) => index),
  );

  constructor() {
    effect(() => {
      const total = this.sortedRows().length;
      const page = this.currentPage();
      const pages = this.totalPages();
      this.announcementState.set(
        total === 0
          ? 'Sin resultados.'
          : `${total} resultados. Página ${page} de ${pages}.`,
      );
    });

    this.destroyRef.onDestroy(() => {
      this.clearSearchTimer();
      this.clearFocusTimer();
    });
  }

  /**
   * Aplica el texto del buscador con un retardo de 300 ms.
   *
   * @param event Evento de entrada del buscador.
   */
  onSearchInput(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    const value = event.target.value;
    this.searchInputState.set(value);
    this.clearSearchTimer();

    this.searchTimer = setTimeout(() => {
      this.searchTimer = null;
      this.searchTermState.set(value.trim());
      this.requestedPage.set(1);
      this.searchChange.emit(value.trim());
    }, 300);
  }

  /**
   * Ordena por una columna o invierte la dirección actual.
   *
   * @param column Columna activada.
   */
  toggleSort(column: TableColumn<T>): void {
    if (!column.sortable) {
      return;
    }

    const current = this.sortState();
    const direction = current?.key === column.key && current.direction === 'asc' ? 'desc' : 'asc';
    const next: SortState = { key: column.key, direction };

    this.sortState.set(next);
    this.requestedPage.set(1);
    this.sortChange.emit(next);
  }

  /**
   * Indica el estado `aria-sort` de una columna.
   *
   * @param column Columna consultada.
   * @returns Estado ARIA de ordenación.
   */
  ariaSort(column: TableColumn<T>): 'ascending' | 'descending' | 'none' {
    const current = this.sortState();

    if (current?.key !== column.key) {
      return 'none';
    }

    return current.direction === 'asc' ? 'ascending' : 'descending';
  }

  /**
   * Icono textual de ordenación.
   *
   * @param column Columna consultada.
   * @returns Flecha correspondiente.
   */
  sortIcon(column: TableColumn<T>): string {
    const current = this.sortState();

    if (current?.key !== column.key) {
      return '↕';
    }

    return current.direction === 'asc' ? '↑' : '↓';
  }

  /**
   * Navega a una página concreta.
   *
   * @param page Número de página solicitado.
   */
  goToPage(page: number): void {
    const target = Math.min(Math.max(1, page), this.totalPages());

    if (target === this.currentPage()) {
      return;
    }

    this.requestedPage.set(target);
    this.pageChange.emit(target);
    this.scheduleFocus();
  }

  /**
   * Emite la fila pulsada.
   *
   * @param row Fila pulsada.
   * @param event Evento de ratón.
   */
  onRowClick(row: T, event: MouseEvent): void {
    if (event.target instanceof Element && event.target.closest('button, a, input, label')) {
      return;
    }

    this.rowSelected.emit(row);
  }

  /**
   * Alterna la selección de una fila.
   *
   * @param row Fila que se alterna.
   * @param event Evento opcional para detener la propagación.
   */
  toggleRow(row: T, event?: Event): void {
    event?.stopPropagation();

    const key = this.rowKey(row);
    const next = new Set(this.selectedKeys());

    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }

    this.selectedKeys.set(next);
    this.emitSelection();
  }

  /** Selecciona o deselecciona todas las filas de la página actual. */
  toggleAll(): void {
    const next = new Set(this.selectedKeys());
    const rows = this.pageRows();
    const selectAll = !rows.every((row) => this.isSelected(row));

    for (const row of rows) {
      const key = this.rowKey(row);

      if (selectAll) {
        next.add(key);
      } else {
        next.delete(key);
      }
    }

    this.selectedKeys.set(next);
    this.emitSelection();
  }

  /**
   * Indica si una fila está seleccionada.
   *
   * @param row Fila consultada.
   * @returns `true` si está seleccionada.
   */
  isSelected(row: T): boolean {
    return this.selectedKeys().has(this.rowKey(row));
  }

  /**
   * Emite una acción de fila.
   *
   * @param action Acción activada.
   * @param row Fila sobre la que se actúa.
   * @param event Evento para detener la propagación.
   */
  onAction(action: RowAction, row: T, event: Event): void {
    event.stopPropagation();
    this.actionTriggered.emit({ actionId: action.id, row });
  }

  /**
   * Obtiene la plantilla personalizada de una columna.
   *
   * @param key Clave de la columna.
   * @returns Directiva de plantilla o `undefined`.
   */
  templateFor(key: string): TableCellDirective | undefined {
    return this.cellTemplates().find((template) => template.column() === key);
  }

  /**
   * Construye el contexto de una plantilla de celda.
   *
   * @param row Fila actual.
   * @param column Columna actual.
   * @returns Contexto tipado.
   */
  cellContext(row: T, column: TableColumn<T>): TableCellContext<unknown> {
    return {
      $implicit: row,
      value: this.cellValue(row, column),
      column: column as unknown as TableColumn<unknown>,
    };
  }

  /**
   * Texto formateado de una celda.
   *
   * @param row Fila actual.
   * @param column Columna actual.
   * @returns Texto legible.
   */
  cellText(row: T, column: TableColumn<T>): string {
    return formatCellValue(this.cellValue(row, column), column.format);
  }

  /**
   * Clase de alineación de una columna.
   *
   * @param column Columna consultada.
   * @returns Clase CSS.
   */
  alignClass(column: TableColumn<T>): string {
    const align: TableColumnAlign = column.align ?? 'start';
    return `data-table__cell--${align}`;
  }

  /**
   * Etiqueta accesible de una fila basada en su primera columna.
   *
   * @param row Fila consultada.
   * @returns Texto identificativo.
   */
  rowLabel(row: T): string {
    const first = this.columns()[0];

    return first ? this.cellText(row, first) : this.rowKey(row);
  }

  /**
   * Etiqueta accesible de una acción de fila.
   *
   * @param action Acción consultada.
   * @param row Fila de la acción.
   * @returns Texto para `aria-label`.
   */
  actionLabel(action: RowAction, row: T): string {
    return `${action.label}: ${this.rowLabel(row)}`;
  }

  /**
   * Etiqueta accesible de la casilla de una fila.
   *
   * @param row Fila consultada.
   * @returns Texto para `aria-label`.
   */
  selectionLabel(row: T): string {
    return `Seleccionar fila ${this.rowLabel(row)}`;
  }

  private cellValue(row: T, column: TableColumn<T>): unknown {
    return (row as Record<string, unknown>)[column.key];
  }

  private cellSearchText(row: T, column: TableColumn<T>): string {
    const raw = this.cellValue(row, column);
    const text = `${String(raw ?? '')} ${this.cellText(row, column)}`;

    return text.toLocaleLowerCase('es');
  }

  private compareRows(left: T, right: T, column: TableColumn<T>): number {
    const leftValue = this.cellValue(left, column);
    const rightValue = this.cellValue(right, column);

    if (leftValue === rightValue) {
      return 0;
    }

    if (leftValue === null || leftValue === undefined) {
      return 1;
    }

    if (rightValue === null || rightValue === undefined) {
      return -1;
    }

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return leftValue - rightValue;
    }

    return this.cellText(left, column).localeCompare(this.cellText(right, column), 'es', {
      numeric: true,
      sensitivity: 'base',
    });
  }

  /**
   * Obtiene una clave estable para una fila.
   *
   * @param row Fila consultada.
   * @returns Clave basada en `id` o generada.
   */
  rowKey(row: T): string {
    const record = row as Record<string, unknown>;
    const id = record['id'];

    if (typeof id === 'string' || typeof id === 'number') {
      return String(id);
    }

    const generated = this.generatedKeys.get(row);

    if (generated) {
      return generated;
    }

    const key = `row-${this.generatedKeyCounter++}`;
    this.generatedKeys.set(row, key);

    return key;
  }

  private emitSelection(): void {
    this.selectionChange.emit([...this.selectedRows()]);
  }

  private scheduleFocus(): void {
    this.clearFocusTimer();

    this.focusTimer = setTimeout(() => {
      this.focusTimer = null;
      this.tableRegion()?.nativeElement.focus();
    }, 0);
  }

  private clearSearchTimer(): void {
    if (this.searchTimer !== null) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  }

  private clearFocusTimer(): void {
    if (this.focusTimer !== null) {
      clearTimeout(this.focusTimer);
      this.focusTimer = null;
    }
  }
}
