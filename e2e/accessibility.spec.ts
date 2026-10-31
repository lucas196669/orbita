import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

import { environment } from '../src/environments/environment';

const MOCK_USER_ID = '00000000-0000-4000-8000-000000000001';
const MOCK_EMAIL = 'admin@orbita.test';
const MOCK_NAME = 'Ada Lovelace';

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'access-control-allow-headers': '*',
  'access-control-expose-headers': 'content-range',
};

function buildSession(): Record<string, unknown> {
  const now = Math.floor(Date.now() / 1000);
  const timestamp = new Date().toISOString();

  return {
    access_token: 'fake-access-token',
    refresh_token: 'fake-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    user: {
      id: MOCK_USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: MOCK_EMAIL,
      email_confirmed_at: timestamp,
      phone: '',
      confirmed_at: timestamp,
      last_sign_in_at: timestamp,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { full_name: MOCK_NAME },
      identities: [],
      created_at: timestamp,
      updated_at: timestamp,
    },
  };
}

async function mockSupabase(page: Page, role: 'admin' | 'user'): Promise<void> {
  const projectRef = new URL(environment.supabaseUrl).hostname.split('.')[0];
  const storageKey = `sb-${projectRef}-auth-token`;
  const session = buildSession();

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
      window.localStorage.setItem('orbita-theme', 'dark');
    },
    { key: storageKey, value: session },
  );

  await page.route(`${environment.supabaseUrl}/auth/v1/**`, async (route: Route) => {
    const request = route.request();

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }

    const url = new URL(request.url());

    if (url.pathname.endsWith('/user')) {
      await route.fulfill({
        status: 200,
        headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
        body: JSON.stringify(session['user']),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify(session),
    });
  });

  await page.route(`${environment.supabaseUrl}/rest/v1/**`, async (route: Route) => {
    const request = route.request();

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }

    const url = new URL(request.url());
    const headers = { ...CORS_HEADERS, 'content-type': 'application/json', 'content-range': '0-0/0' };

    if (url.pathname.endsWith('/profiles')) {
      await route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify([{ role, full_name: MOCK_NAME }]),
      });
      return;
    }

    if (url.pathname.includes('/rpc/')) {
      await route.fulfill({ status: 200, headers, body: JSON.stringify(false) });
      return;
    }

    await route.fulfill({ status: 200, headers, body: JSON.stringify([]) });
  });
}

async function expectNoSeriousViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();

  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );

  expect(
    blocking.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
}

const publicRoutes = ['/login', '/registro', '/acceso-denegado', '/ruta-inexistente'];
const privateRoutes = [
  '/app/inicio',
  '/app/productos',
  '/app/productos/nuevo',
  '/app/pedidos',
  '/app/dashboard',
  '/app/ayuda',
];

test.describe('Auditoría axe · rutas públicas', () => {
  for (const route of publicRoutes) {
    test(`sin violaciones graves en ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectNoSeriousViolations(page);
    });
  }
});

test.describe('Auditoría axe · rutas autenticadas', () => {
  for (const route of privateRoutes) {
    test(`sin violaciones graves en ${route}`, async ({ page }) => {
      await mockSupabase(page, 'admin');
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectNoSeriousViolations(page);
    });
  }
});

test('el enlace de salto mueve el foco al contenido principal', async ({ page }) => {
  await mockSupabase(page, 'admin');
  await page.goto('/app/inicio');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('button', { name: 'Saltar al contenido' });
  await expect(skipLink).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.locator('#contenido')).toBeFocused();
});

test('debug session', async ({ page }) => {
  await mockSupabase(page, 'admin');
  await page.goto('/app/inicio');
  const info = await page.evaluate(() => ({
    keys: Object.keys(window.localStorage),
    session: window.localStorage.getItem('sb-uscyvqmdekernuioeraq-auth-token'),
    path: window.location.pathname,
  }));
  console.log(JSON.stringify(info));
});

test('debug skip', async ({ page }) => {
  await mockSupabase(page, 'admin');
  await page.goto('/app/inicio');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const info = await page.evaluate(() => ({
    path: window.location.pathname,
    keys: Object.keys(window.localStorage),
    h1: document.querySelector('h1')?.textContent,
    skip: document.querySelector('app-skip-link')?.outerHTML,
    main: document.querySelector('main')?.outerHTML.slice(0, 200),
  }));
  console.log(JSON.stringify(info));
});

test('debug network', async ({ page }) => {
  page.on('console', (msg) => console.log('CONSOLE', msg.type(), msg.text()));
  page.on('response', (res) => {
    if (res.url().includes('supabase')) console.log('RESPONSE', res.status(), res.url());
  });
  page.on('requestfailed', (req) => console.log('FAILED', req.url(), req.failure()?.errorText));
  await mockSupabase(page, 'admin');
  await page.goto('/app/inicio');
  await page.waitForTimeout(3000);
  const info = await page.evaluate(() => ({
    path: window.location.pathname,
    h1: document.querySelector('h1')?.textContent,
  }));
  console.log(JSON.stringify(info));
});

test('debug profiles body', async ({ page }) => {
  page.on('response', async (res) => {
    if (res.url().includes('/profiles')) {
      console.log('PROFILE', res.status(), await res.text());
    }
  });
  await mockSupabase(page, 'admin');
  await page.goto('/app/inicio');
  await page.waitForTimeout(3000);
  console.log('URL', page.url());
});
