import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { FirestoreActivityService } from './firestore-activity.service';

describe('FirestoreActivityService without Firestore', () => {
  let service: FirestoreActivityService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(FirestoreActivityService);
  });

  it('reports that the integration is disabled', () => {
    expect(service.enabled).toBe(false);
  });

  it('returns an empty activity stream', async () => {
    await expect(firstValueFrom(service.activity$())).resolves.toEqual([]);
  });

  it('rejects writes with a clear message', async () => {
    await expect(service.log('Producto creado', 'ana@demo.com')).rejects.toThrow('Firestore no está configurado.');
    await expect(service.seedDemoData()).rejects.toThrow('Firestore no está configurado.');
  });
});
