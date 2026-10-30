import { Injectable, signal } from '@angular/core';

interface PlaceholderCard {
  readonly title: string;
  readonly description: string;
}

/** ViewModel del placeholder de ayuda. */
@Injectable()
export class HelpStore {
  private readonly titleState = signal('Ayuda');
  private readonly descriptionState = signal(
    'La documentación de uso reunirá guías breves, preguntas frecuentes y canales de soporte.',
  );
  private readonly cardsState = signal<readonly PlaceholderCard[]>([
    { title: 'Primeros pasos', description: 'Cómo orientarte por el panel y encontrar cada módulo.' },
    { title: 'Preguntas frecuentes', description: 'Respuestas rápidas a los bloqueos más habituales.' },
    { title: 'Soporte', description: 'Cómo contactar con administración cuando necesites ayuda.' },
  ]);

  /** Título de la página. */
  readonly title = this.titleState.asReadonly();
  /** Texto introductorio. */
  readonly description = this.descriptionState.asReadonly();
  /** Tarjetas esqueleto del módulo. */
  readonly cards = this.cardsState.asReadonly();
}
