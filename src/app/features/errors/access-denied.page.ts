import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Página 403 para rutas restringidas por rol. */
@Component({
  selector: 'app-access-denied',
  templateUrl: 'access-denied.page.html',
  styleUrls: ['status.page.scss'],
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessDeniedPage {}
