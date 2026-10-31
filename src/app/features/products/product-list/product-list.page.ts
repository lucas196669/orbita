import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import type { ElementRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';

import type { Product } from '../../../core/models/product.model';
import { AuthService } from '../../../core/services/auth.service';
import { FirestoreActivityService } from '../../../core/services/firestore-activity.service';
import { ToastService } from '../../../core/services/toast.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import type { TableActionEvent } from '../../../shared/components/data-table/data-table.model';
import { TableCellDirective } from '../../../shared/components/data-table/table-cell.directive';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import type { ExportColumn } from '../../../shared/services/export.service';
import { ExportService } from '../../../shared/services/export.service';
import { captureDialogTrigger, restoreDialogFocus } from '../../../shared/utils/dialog-focus';
import { describeDataError } from '../../../shared/utils/error-messages';

import { ProductListStore } from './product-list.store';

const PRODUCT_EXPORT_COLUMNS: readonly ExportColumn<Product>[] = [
  { header: 'Producto', value: (product) => product.name },
  { header: 'Categoría', value: (product) => product.category },
  { header: 'Precio', value: (product) => product.price },
  { header: 'Stock', value: (product) => product.stock },
];

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
  private readonly auth = inject(AuthService);
  private readonly activity = inject(FirestoreActivityService);
  private readonly exportService = inject(ExportService);
  private readonly document = inject(DOCUMENT);

  /** Servicio de avisos accesibles. */
  readonly toast = inject(ToastService);

  /** Indica que se está generando un PDF. */
  readonly exporting = signal(false);

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
  private dialogTrigger: HTMLElement | null = null;

  /** Exporta el catálogo completo a CSV. */
  exportCsv(): void {
    const products = this.vm.products();

    if (products.length === 0) {
      this.toast.show('No hay productos que exportar.');
      return;
    }

    this.exportService.exportCsv('orbita-productos', PRODUCT_EXPORT_COLUMNS, products);
    this.toast.show('CSV generado correctamente.');
  }

  /** Exporta el catálogo completo a PDF. */
  async exportPdf(): Promise<void> {
    const products = this.vm.products();

    if (products.length === 0) {
      this.toast.show('No hay productos que exportar.');
      return;
    }

    this.exporting.set(true);

    try {
      await this.exportService.exportPdf<Product>({
        filename: 'orbita-productos',
        title: 'Catálogo de productos',
        subtitle: 'Inventario actual de Orbita',
        columns: PRODUCT_EXPORT_COLUMNS,
        rows: products,
        generatedBy: this.vm.displayName(),
        accentColor: this.readToken('--color-accent', '#c6f24e'),
        accentTextColor: this.readToken('--color-accent-contrast', '#0a0c11'),
      });
      this.toast.show('PDF generado correctamente.');
    } catch {
      this.toast.show('No se pudo generar el PDF. Inténtalo de nuevo.');
    } finally {
      this.exporting.set(false);
    }
  }

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
    this.dialogTrigger = captureDialogTrigger(this.document);
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
    restoreDialogFocus(this.document, this.dialogTrigger);
    this.dialogTrigger = null;
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
      await this.logActivity(product.name);
      this.confirmDialog()?.nativeElement.close();
    } catch (error) {
      this.deleteError.set(describeDataError(error));
    } finally {
      this.deleting.set(false);
    }
  }

  private readToken(token: string, fallback: string): string {
    const styles = this.document.defaultView?.getComputedStyle(this.document.documentElement);

    return styles?.getPropertyValue(token).trim() || fallback;
  }

  private async logActivity(productName: string): Promise<void> {
    try {
      await this.activity.log('Producto eliminado', this.auth.user()?.email ?? 'Usuario', productName);
    } catch {
      this.toast.show('El producto se eliminó, pero no se pudo registrar la actividad.');
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
