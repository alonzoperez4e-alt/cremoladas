process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.DATABASE_URL =
  'postgresql://fake_user:fake_password@ep-fake.us-east-2.aws.neon.tech/neondb?sslmode=require';
process.env.JWT_SECRET = 'this_is_a_very_secure_test_jwt_secret_with_more_than_32_characters';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.RATE_LIMIT_LOGIN_MAX = '5'; // 5 para probar rápido el rate limiter
process.env.RATE_LIMIT_LOGIN_WINDOW_MINS = '15';

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

const { createApp } = await import('../src/app.js');
const { authRepository } = await import('../src/modules/auth/auth.repository.js');

describe('6. Endpoints HTTP y Rate Limiting', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Mock repo methods para peticiones HTTP
    authRepository.findByUsername = async () => null;

    const app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('Ruta no encontrada retorna 404 con formato uniforme de error', async () => {
    const res = await fetch(`${baseUrl}/api/ruta-inexistente`);
    const data = await res.json();

    assert.strictEqual(res.status, 404);
    assert.strictEqual(data.error.code, 'NOT_FOUND');
    assert.match(data.error.message, /Ruta no encontrada/i);
  });

  it('Payload de login con datos inválidos retorna 400 VALIDATION_ERROR con details', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'a', password: '' }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.error.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(data.error.details));
    assert.strictEqual(data.error.details.length >= 2, true);
  });

  it('Tras exceder el límite de intentos de login, se recibe 429 TOO_MANY_REQUESTS', async () => {
    // Hacemos llamadas repetidas de login
    let lastStatus = 0;
    let lastData = null;

    for (let i = 0; i < 6; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'usuario_intento', password: 'password123' }),
      });
      lastStatus = res.status;
      lastData = await res.json();
    }

    assert.strictEqual(lastStatus, 429);
    assert.strictEqual(lastData.error.code, 'TOO_MANY_REQUESTS');
    assert.match(lastData.error.message, /Demasiados intentos de inicio de sesión/i);
  });
});
