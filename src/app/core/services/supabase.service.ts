import { Injectable } from '@angular/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

/** Cliente singleton de Supabase configurado desde el entorno. */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  /** Cliente de Supabase compartido por los servicios de datos. */
  readonly client: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
