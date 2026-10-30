import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';

import { PRODUCT_CATEGORIES, type ProductCategory, type ProductInput } from '../../../core/models/product.model';
import { ProductsService } from '../../../core/services/products.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { describeDataError } from '../../../shared/utils/error-messages';
import { controlErrorMessage, focusFirstInvalidControl } from '../../../shared/utils/form-errors';
import { integerNumber, maxTwoDecimals } from '../../../shared/validators/product.validator';
import { uniqueProductNameValidator } from '../../../shared/validators/unique-product-name.validator';
import { hasValidationNotice } from '../../../shared/validators/validation-notice';

/** Alta y edición de productos con validaciones y vista previa en vivo. */
@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.page.html',
  styleUrls: ['./product-form.page.scss'],
  imports: [IonContent, RouterLink, DecimalPipe, ReactiveFormsModule, FormFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly productsService = inject(ProductsService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  private originalName = '';

  /** Categorías disponibles en el select. */
  readonly categories = PRODUCT_CATEGORIES;

  /** Identificador del producto en modo edición. */
  readonly productId = signal<string | null>(null);

  /** Indica si el formulario está en modo edición. */
  readonly isEdit = computed(() => this.productId() !== null);

  /** Estado de carga del producto. */
  readonly loading = signal(false);

  /** Error al cargar el producto. */
  readonly loadError = signal<string | null>(null);

  /** Indica si se ha intentado enviar el formulario. */
  readonly submitAttempted = signal(false);

  /** Indica que el guardado está en curso. */
  readonly submitting = signal(false);

  /** Error devuelto por el servidor. */
  readonly serverError = signal<string | null>(null);

  /** Formulario reactivo de producto. */
  readonly form = this.fb.nonNullable.group({
    name: [
      '',
      {
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(80)],
        asyncValidators: [uniqueProductNameValidator(this.supabase, () => this.originalName)],
      },
    ],
    category: ['Hardware' as ProductCategory, [Validators.required]],
    price: [0, [Validators.required, Validators.min(0.01), maxTwoDecimals]],
    stock: [0, [Validators.required, Validators.min(0), integerNumber]],
  });

  private readonly formStatus = toSignal(this.form.statusChanges, { initialValue: this.form.status });
  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  /** Vista previa derivada de los valores actuales del formulario. */
  readonly preview = computed(() => {
    this.formValue();
    const value = this.form.getRawValue();

    return {
      name: value.name.trim() || 'Nombre del producto',
      category: value.category,
      price: Number(value.price) || 0,
      stock: Number(value.stock) || 0,
    };
  });

  /** Indica si hay carga, validación pendiente o guardado en curso. */
  readonly isBusy = computed(() => this.loading() || this.submitting() || this.formStatus() === 'PENDING');

  constructor() {
    void this.loadProduct();
  }

  /**
   * Comprueba si un campo debe mostrar error.
   *
   * @param name Nombre del control.
   * @returns `true` si el campo es inválido y ya se ha tocado o enviado.
   */
  isInvalid(name: string): boolean {
    this.formStatus();
    const control = this.form.get(name);

    return !!control && control.invalid && (control.touched || this.submitAttempted());
  }

  /**
   * Indica si un campo está validándose en remoto.
   *
   * @param name Nombre del control.
   * @returns `true` si el control está pendiente.
   */
  isPending(name: string): boolean {
    this.formStatus();

    return this.form.get(name)?.pending ?? false;
  }

  /**
   * Obtiene el mensaje de error de un campo.
   *
   * @param name Nombre del control.
   * @param label Etiqueta visible.
   * @returns Mensaje o `null`.
   */
  errorFor(name: string, label: string): string | null {
    return this.isInvalid(name) ? controlErrorMessage(this.form.get(name), label) : null;
  }

  /** Aviso discreto cuando la comprobación remota del nombre no está disponible. */
  nameHint(): string {
    this.formStatus();

    return hasValidationNotice(this.form.get('name'))
      ? 'No pudimos comprobar la disponibilidad del nombre. Puedes guardar.'
      : 'El nombre debe ser único en el catálogo.';
  }

  /** Guarda el producto y vuelve al listado. */
  async submit(): Promise<void> {
    this.submitAttempted.set(true);
    this.serverError.set(null);

    if (this.form.pending) {
      return;
    }

    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }

    const value = this.form.getRawValue();
    const input: ProductInput = {
      name: value.name.trim(),
      category: value.category,
      price: Number(value.price),
      stock: Number(value.stock),
    };

    this.submitting.set(true);

    try {
      const id = this.productId();

      if (id) {
        await this.productsService.update(id, input);
        this.toast.show('Producto actualizado correctamente.');
      } else {
        await this.productsService.create(input);
        this.toast.show('Producto creado correctamente.');
      }

      await this.router.navigateByUrl('/app/productos');
    } catch (error) {
      this.serverError.set(describeDataError(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private async loadProduct(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    this.productId.set(id);
    this.loading.set(true);

    try {
      const product = await this.productsService.getById(id);

      if (!product) {
        this.loadError.set('No se encontró el producto solicitado.');
        return;
      }

      this.originalName = product.name;
      this.form.patchValue({
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
      });
      this.form.markAsPristine();
    } catch (error) {
      this.loadError.set(describeDataError(error));
    } finally {
      this.loading.set(false);
    }
  }

  private focusFirstInvalid(): void {
    focusFirstInvalidControl(
      this.form,
      {
        name: 'product-name',
        category: 'product-category',
        price: 'product-price',
        stock: 'product-stock',
      },
      'product-name',
    );
  }
}
