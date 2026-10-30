import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import type { ElementRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';

import type { Product } from '../../../core/models/product.model';
import { ToastService } from '../../../core/services/toast.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import type { TableActionEvent } from '../../../shared/components/data-table/data-table.model';
import { TableCellDirective } from '../../../shared/components/data-table/table-cell.directive';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { describeDataError } from '../../../shared/utils/error-messages';

import { ProductListStore } from './product-list.store';

/** Catálogo de productos servido por la tabla de datos compartida. */
@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.page.html',
  styleUrls: ['./product-list.page.scss'],
  imports: [IonContent, RouterLink, DataTableComponent, TableCellDirective, ToastComponent],
  providers: [ProductListStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListPage {
  private readonly store = inject(ProductListStore);
  private readonly router = inject(Router);

  /** Servicio de avisos accesibles. */
  readonly toast = inject(ToastService);

  /** ViewModel del listado. */
  readonly vm = this.store;

  /** Producto pendiente de confirmación de borrado. */
  readonly pendingDelete = signal<Product | null>(null);

  /** Indica que el borrado está en curso. */
  readonly deleting = signal(false);

  /** Error al borrar un producto. */
  readonly deleteError = signal<string | null>(null);

  /** Indica si la persona usuaria puede crear productos. */
  readonly canCreate = computed(() => this.vm.isAdmin());

  private readonly confirmDialog = viewChild<ElementRef<HTMLDialogElement>>('confirmDialog');

  /**
   * Gestiona las acciones de fila de la tabla.
   *
   * @param event Acción emitida por la tabla.
   */
  onAction(event: TableActionEvent<Product>): void {
    if (event.actionId === 'edit') {
      void this.router.navigate(['/app/productos', event.row.id, 'editar']);
      return;
    }

    if (event.actionId === 'delete') {
      this.askDelete(event.row);
    }
  }

  /**
   * Abre el diálogo de confirmación de borrado.
   *
   * @param product Producto que se quiere eliminar.
   */
  askDelete(product: Product): void {
    this.pendingDelete.set(product);
    this.deleteError.set(null);
    this.confirmDialog()?.nativeElement.showModal();
  }

  /** Cierra el diálogo sin eliminar. */
  cancelDelete(): void {
    this.confirmDialog()?.nativeElement.close();
  }

  /** Sincroniza el estado cuando el diálogo se cierra (incluido Escape). */
  onDialogClose(): void {
    this.pendingDelete.set(null);
    this.deleteError.set(null);
  }

  /** Confirma el borrado del producto pendiente. */
  async confirmDelete(): Promise<void> {
    const product = this.pendingDelete();

    if (!product) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);

    try {
      await this.vm.remove(product.id);
      this.toast.show('Producto eliminado correctamente.');
      this.confirmDialog()?.nativeElement.close();
    } catch (error) {
      this.deleteError.set(describeDataError(error));
    } finally {
      this.deleting.set(false);
    }
  }

  /**
   * Convierte el valor de stock de una plantilla personalizada.
   *
   * @param row Fila de la tabla.
   * @returns Unidades disponibles.
   */
  stockOf(row: unknown): number {
    return Number((row as Record<string, unknown>)['stock'] ?? 0);
  }
}
