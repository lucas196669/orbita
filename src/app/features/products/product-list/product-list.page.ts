import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';

import type { Product } from '../../../core/models/product.model';
import { AuthService } from '../../../core/services/auth.service';
import { ProductsService } from '../../../core/services/products.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { describeDataError } from '../../../shared/utils/error-messages';

/** Listado básico de productos con búsqueda local y acciones por rol. */
@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.page.html',
  styleUrls: ['./product-list.page.scss'],
  imports: [IonContent, RouterLink, FormsModule, DecimalPipe, FormFieldComponent, ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListPage {
  private readonly productsService = inject(ProductsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Servicio de avisos accesibles. */
  readonly toast = inject(ToastService);

  /** Productos cargados desde Supabase. */
  readonly products = signal<Product[]>([]);

  /** Estado de carga inicial. */
  readonly loading = signal(true);

  /** Error de carga. */
  readonly error = signal<string | null>(null);

  /** Indica si la persona usuaria es administradora. */
  readonly isAdmin = computed(() => this.auth.role() === 'admin');

  /** Nombre visible de la persona autenticada. */
  readonly displayName = computed(() => this.auth.profile()?.fullName || this.auth.user()?.email || 'Usuario');

  /** Término de búsqueda enlazado con `[(ngModel)]`. */
  searchTerm = '';

  constructor() {
    void this.load();
  }

  /**
   * Filtra los productos por nombre o categoría.
   *
   * @returns Productos visibles según la búsqueda.
   */
  filteredProducts(): Product[] {
    const term = this.searchTerm.trim().toLocaleLowerCase('es');
    const products = this.products();

    if (!term) {
      return products;
    }

    return products.filter(
      (product) =>
        product.name.toLocaleLowerCase('es').includes(term) || product.category.toLocaleLowerCase('es').includes(term),
    );
  }

  /** Recarga el listado. */
  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      this.products.set(await this.productsService.list());
    } catch (error) {
      this.error.set(describeDataError(error));
    } finally {
      this.loading.set(false);
    }
  }

  /** Cierra la sesión y vuelve al acceso. */
  async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/login');
  }
}
