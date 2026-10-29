/**
 * Configuración de desarrollo.
 *
 * Las credenciales reales nunca deben versionarse: se sustituyen los valores
 * `PEGAR_AQUI` en local o se inyectan desde el proveedor de despliegue.
 */
export const environment = {
  production: false,
  supabaseUrl: 'PEGAR_AQUI',
  supabaseKey: 'PEGAR_AQUI',
  firebase: {
    apiKey: 'PEGAR_AQUI',
    authDomain: '',
    projectId: '',
    appId: '',
  },
};
