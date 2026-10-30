import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  doc,
  Firestore,
  getDocs,
  limit as limitTo,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from '@angular/fire/firestore';
import { map, type Observable, of } from 'rxjs';

import { DEMO_ACTIVITY_ACTIONS, type ActivityLog } from '../models/activity.model';

/** Nombre de la colección documental de actividad. */
export const ACTIVITY_COLLECTION = 'activity';

/** Documento tal y como llega de Firestore antes de normalizarlo. */
interface ActivityDocument {
  readonly id?: string;
  readonly action?: unknown;
  readonly actor?: unknown;
  readonly detail?: unknown;
  readonly createdAt?: unknown;
}

const DEMO_ACTORS = ['ana@demo.com', 'bruno@demo.com', 'carla@demo.com', 'diego@demo.com', 'elena@demo.com'] as const;
const DEMO_DETAILS = [
  'Alta desde el panel de administración',
  'Actualización de inventario',
  'Pedido validado por el equipo',
  'Acceso al espacio de trabajo',
  'Revisión periódica de stock',
] as const;

/**
 * Acceso a la colección documental `activity` de Firestore.
 *
 * El servicio es seguro cuando Firebase no está configurado: en ese caso
 * devuelve una colección vacía y `log` informa del error al llamador para que
 * pueda mostrar un aviso discreto sin bloquear el flujo principal.
 */
@Injectable({ providedIn: 'root' })
export class FirestoreActivityService {
  private readonly firestore = inject(Firestore, { optional: true });

  /** Indica si Firestore está disponible en el entorno actual. */
  readonly enabled = this.firestore !== null;

  /**
   * Escucha en tiempo real los últimos registros de actividad.
   *
   * @param max Número máximo de documentos solicitados.
   * @returns Flujo de actividad ordenada de más reciente a más antigua.
   */
  activity$(max = 25): Observable<readonly ActivityLog[]> {
    const store = this.firestore;

    if (!store) {
      return of([]);
    }

    const reference = query(collection(store, ACTIVITY_COLLECTION), orderBy('createdAt', 'desc'), limitTo(max));

    return collectionData(reference, { idField: 'id' }).pipe(
      // La colección devuelve documentos heterogéneos; se normalizan antes de
      // exponerlos para no filtrar `unknown` a la vista.
      map((rows) => (rows as readonly ActivityDocument[]).map((row) => this.toActivity(row))),
    );
  }

  /**
   * Registra una acción en Firestore.
   *
   * @param action Acción ejecutada.
   * @param actor Persona responsable.
   * @param detail Detalle opcional.
   */
  async log(action: string, actor: string, detail?: string): Promise<void> {
    const store = this.requireFirestore();

    await addDoc(collection(store, ACTIVITY_COLLECTION), {
      action,
      actor,
      detail: detail ?? null,
      createdAt: serverTimestamp(),
    });
  }

  /**
   * Genera 30 registros sintéticos repartidos en los últimos 30 días.
   *
   * Si la colección ya contiene documentos no inserta nada para evitar
   * duplicados. La comprobación de rol se realiza en la vista que lo invoca.
   *
   * @returns Número de documentos creados.
   */
  async seedDemoData(): Promise<number> {
    const store = this.requireFirestore();
    const existing = await getDocs(query(collection(store, ACTIVITY_COLLECTION), limitTo(1)));

    if (!existing.empty) {
      return 0;
    }

    const batch = writeBatch(store);
    const now = new Date();

    for (let index = 0; index < 30; index += 1) {
      const createdAt = new Date(now);
      createdAt.setDate(now.getDate() - index);
      createdAt.setHours(9 + (index % 8), (index * 7) % 60, 0, 0);

      const action = DEMO_ACTIVITY_ACTIONS[index % DEMO_ACTIVITY_ACTIONS.length];
      const actor = DEMO_ACTORS[index % DEMO_ACTORS.length];
      const detail = DEMO_DETAILS[index % DEMO_DETAILS.length];

      batch.set(doc(collection(store, ACTIVITY_COLLECTION)), {
        action,
        actor,
        detail,
        createdAt: Timestamp.fromDate(createdAt),
      });
    }

    await batch.commit();

    return 30;
  }

  private requireFirestore(): Firestore {
    if (!this.firestore) {
      throw new Error('Firestore no está configurado.');
    }

    return this.firestore;
  }

  private toActivity(row: ActivityDocument): ActivityLog {
    return {
      id: typeof row.id === 'string' ? row.id : '',
      action: this.toText(row.action) || 'Actividad sin descripción',
      actor: this.toText(row.actor) || 'Sistema',
      detail: this.toText(row.detail) || undefined,
      createdAt: this.toDate(row.createdAt),
    };
  }

  private toText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private toDate(value: unknown): Date {
    if (value instanceof Date) {
      return value;
    }

    if (isTimestampLike(value)) {
      return value.toDate();
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return new Date(0);
  }
}

/** Valor con método `toDate`, como el `Timestamp` de Firestore. */
interface TimestampLike {
  toDate(): Date;
}

/**
 * Comprueba si un valor se comporta como un `Timestamp`.
 *
 * @param value Valor candidato.
 * @returns `true` si expone `toDate`.
 */
function isTimestampLike(value: unknown): value is TimestampLike {
  return typeof value === 'object' && value !== null && typeof (value as TimestampLike).toDate === 'function';
}
