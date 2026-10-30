import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { type ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import {
  PreloadAllModules,
  provideRouter,
  RouteReuseStrategy,
  withComponentInputBinding,
  withPreloading,
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

import { environment } from '../environments/environment';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';

const firebaseConfigured =
  !environment.firebase.apiKey.startsWith('PEGAR_AQUI') &&
  environment.firebase.projectId.length > 0 &&
  environment.firebase.appId.length > 0;

/** Configuración de arranque de la aplicación Orbita. */
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    ...(firebaseConfigured
      ? [provideFirebaseApp(() => initializeApp(environment.firebase)), provideFirestore(() => getFirestore())]
      : []),
    provideAppInitializer(() => inject(AuthService).init()),
  ],
};
