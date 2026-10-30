import { Directive, input, TemplateRef } from '@angular/core';

import type { TableCellContext } from './data-table.model';

/**
 * Marca una plantilla como renderizador personalizado de una columna.
 *
 * ```html
 * <ng-template appTableCell="status" let-row>
 *   <span>{{ row.status }}</span>
 * </ng-template>
 * ```
 */
@Directive({
  selector: '[appTableCell]',
  standalone: true,
})
export class TableCellDirective {
  /** Clave de la columna que personaliza la plantilla. */
  readonly column = input.required<string>({ alias: 'appTableCell' });

  constructor(readonly template: TemplateRef<TableCellContext<unknown>>) {}
}
