import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ThemeService } from '../../core/services/theme.service';
import { SkipLinkComponent } from '../../shared/components/skip-link/skip-link.component';

import { SHELL_ICONS } from './shell.icons';
import { ShellStore } from './shell.store';

/** Shell principal con rail de escritorio y pestañas flotantes en móvil. */
@Component({
  selector: 'app-shell',
  templateUrl: 'shell.component.html',
  styleUrls: ['shell.component.scss'],
  imports: [RouterLink, RouterLinkActive, RouterOutlet, SkipLinkComponent],
  providers: [ShellStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly store = inject(ShellStore);
  private readonly theme = inject(ThemeService);

  /** ViewModel del shell. */
  readonly vm = this.store;
  /** Trazados de los iconos del menú. */
  readonly icons = SHELL_ICONS;
  /** El tema actual es oscuro. */
  readonly isDark = this.theme.isDark;

  /** Alterna el tema claro/oscuro. */
  toggleTheme(): void {
    this.theme.toggle();
  }

  /** Cierra la sesión actual. */
  logout(): void {
    void this.vm.logout();
  }
}
