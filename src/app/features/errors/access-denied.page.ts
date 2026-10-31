import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SkipLinkComponent } from '../../shared/components/skip-link/skip-link.component';

/** Página 403 para rutas restringidas por rol. */
@Component({
  selector: 'app-access-denied',
  templateUrl: 'access-denied.page.html',
  styleUrls: ['status.page.scss'],
  imports: [RouterLink, SkipLinkComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessDeniedPage {}
