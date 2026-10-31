import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SkipLinkComponent } from '../../shared/components/skip-link/skip-link.component';

/** Página 404 para rutas inexistentes. */
@Component({
  selector: 'app-not-found',
  templateUrl: 'not-found.page.html',
  styleUrls: ['status.page.scss'],
  imports: [RouterLink, SkipLinkComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
