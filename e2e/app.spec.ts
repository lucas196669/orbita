import { expect, test } from '@playwright/test';

test('redirige al acceso y muestra el formulario', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { level: 1, name: 'Inicia sesión' })).toBeVisible();
  await expect(page).toHaveTitle('Iniciar sesión · Orbita');
});
