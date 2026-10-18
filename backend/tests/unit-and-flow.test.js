// Preconfigurar variables de entorno antes de importar cualquier módulo dependiente de env.js
process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.DATABASE_URL =
  'postgresql://fake_user:fake_password@ep-fake.us-east-2.aws.neon.tech/neondb?sslmode=require';
process.env.JWT_SECRET = 'this_is_a_very_secure_test_jwt_secret_with_more_than_32_characters';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_URL = 'http://localhost:3000,http://localhost:5173';
process.env.RATE_LIMIT_LOGIN_MAX = '10';

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

// Importación dinámica tras setear process.env
const { loginSchema, changePasswordSchema } = await import(
  '../src/modules/auth/auth.schemas.js'
);
const { hashPassword, comparePassword, compareDummyPassword } = await import(
  '../src/utils/password.js'
);
const { signToken, verifyToken } = await import('../src/utils/jwt.js');
const { AppError } = await import('../src/utils/AppError.js');
const { errorHandler } = await import('../src/middlewares/errorHandler.js');
const { requireAuth } = await import('../src/middlewares/auth.js');
const { authService } = await import('../src/modules/auth/auth.service.js');
const { authRepository } = await import('../src/modules/auth/auth.repository.js');

describe('1. Validaciones de Schemas (Zod)', () => {
  it('loginSchema debe rechazar usuarios con espacios', () => {
    const res = loginSchema.safeParse({ username: 'user name', password: 'password123' });
    assert.strictEqual(res.success, false);
    assert.match(res.error.issues[0].message, /espacios/i);
  });

  it('loginSchema debe rechazar usuarios menores a 3 caracteres', () => {
    const res = loginSchema.safeParse({ username: 'ab', password: 'password123' });
    assert.strictEqual(res.success, false);
    assert.match(res.error.issues[0].message, /al menos 3/i);
  });

  it('loginSchema debe aceptar usuario y contraseña válidos', () => {
    const res = loginSchema.safeParse({ username: 'admin_test', password: 'password123' });
    assert.strictEqual(res.success, true);
  });

  it('changePasswordSchema debe requerir al menos 8 caracteres para la nueva contraseña', () => {
    const res = changePasswordSchema.safeParse({
      currentPassword: 'actualPassword1',
      newPassword: 'short',
    });
    assert.strictEqual(res.success, false);
    assert.match(res.error.issues[0].message, /al menos 8/i);
  });

  it('changePasswordSchema debe rechazar si la nueva contraseña es idéntica a la actual', () => {
    const res = changePasswordSchema.safeParse({
      currentPassword: 'samePassword123',
      newPassword: 'samePassword123',
    });
    assert.strictEqual(res.success, false);
    assert.match(res.error.issues[0].message, /distinta a la actual/i);
  });
});

describe('2. Utilidades de Contraseña y JWT', () => {
  it('hashPassword genera un hash bcrypt válido y comparePassword lo verifica', async () => {
    const raw = 'PasswordSegura123!';
    const hash = await hashPassword(raw);
    assert.ok(hash.startsWith('$2a$12$') || hash.startsWith('$2b$12$'));
    const isMatch = await comparePassword(raw, hash);
    assert.strictEqual(isMatch, true);
    const isWrong = await comparePassword('wrong', hash);
    assert.strictEqual(isWrong, false);
  });

  it('compareDummyPassword retorna false', async () => {
    const res = await compareDummyPassword('anypassword');
    assert.strictEqual(res, false);
  });

  it('signToken y verifyToken operan correctamente', () => {
    const token = signToken({ sub: '42', username: 'pedro' });
    const decoded = verifyToken(token);
    assert.strictEqual(decoded.sub, '42');
    assert.strictEqual(decoded.username, 'pedro');
  });
});

describe('3. Formato Uniforme de Manejo de Errores', () => {
  it('errorHandler responde con el formato JSON estandarizado { error: { code, message, details } }', () => {
    let capturedStatus = 0;
    let capturedBody = null;
    const res = {
      status(code) {
        capturedStatus = code;
        return {
          json(body) {
            capturedBody = body;
          },
        };
      },
    };

    const error = new AppError(400, 'VALIDATION_ERROR', 'Campos inválidos', [
      { field: 'username', message: 'Requerido' },
    ]);

    errorHandler(error, {}, res, () => {});

    assert.strictEqual(capturedStatus, 400);
    assert.deepStrictEqual(capturedBody, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Campos inválidos',
        details: [{ field: 'username', message: 'Requerido' }],
      },
    });
  });
});

describe('4. Lógica del Servicio de Autenticación y Seguridad', () => {
  let sampleHash;

  before(async () => {
    sampleHash = await hashPassword('Secret123456');
  });

  it('login con usuario inexistente arroja 401 "Usuario o contraseña incorrectos"', async () => {
    authRepository.findByUsername = async () => null;

    await assert.rejects(
      async () => {
        await authService.login({ username: 'noexiste', password: 'password123' });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 401);
        assert.strictEqual(err.code, 'INVALID_CREDENTIALS');
        assert.strictEqual(err.message, 'Usuario o contraseña incorrectos');
        return true;
      }
    );
  });

  it('login con contraseña incorrecta arroja exactamente el mismo 401 "Usuario o contraseña incorrectos"', async () => {
    authRepository.findByUsername = async () => ({
      id: 1,
      username: 'existente',
      password_hash: sampleHash,
      full_name: 'Usuario Existente',
      is_active: true,
    });

    await assert.rejects(
      async () => {
        await authService.login({ username: 'existente', password: 'claveIncorrecta' });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 401);
        assert.strictEqual(err.code, 'INVALID_CREDENTIALS');
        assert.strictEqual(err.message, 'Usuario o contraseña incorrectos');
        return true;
      }
    );
  });

  it('login con usuario inactivo arroja exactamente el mismo 401 "Usuario o contraseña incorrectos"', async () => {
    authRepository.findByUsername = async () => ({
      id: 1,
      username: 'inactivo',
      password_hash: sampleHash,
      full_name: 'Usuario Inactivo',
      is_active: false,
    });

    await assert.rejects(
      async () => {
        await authService.login({ username: 'inactivo', password: 'Secret123456' });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 401);
        assert.strictEqual(err.code, 'INVALID_CREDENTIALS');
        assert.strictEqual(err.message, 'Usuario o contraseña incorrectos');
        return true;
      }
    );
  });

  it('login correcto devuelve token y datos del usuario sin password_hash', async () => {
    authRepository.findByUsername = async () => ({
      id: 1,
      username: 'admin',
      password_hash: sampleHash,
      full_name: 'Administrador del Sistema',
      is_active: true,
    });

    const result = await authService.login({ username: 'admin', password: 'Secret123456' });
    assert.ok(result.token);
    assert.strictEqual(result.user.id, 1);
    assert.strictEqual(result.user.username, 'admin');
    assert.strictEqual(result.user.fullName, 'Administrador del Sistema');
    assert.strictEqual(result.user.password_hash, undefined);
  });
});

describe('5. Middleware requireAuth', () => {
  it('falla con 401 TOKEN_MISSING si no se provee encabezado Authorization', async () => {
    const req = { headers: {} };
    let capturedErr = null;
    await requireAuth(req, {}, (err) => {
      capturedErr = err;
    });

    assert.ok(capturedErr);
    assert.strictEqual(capturedErr.statusCode, 401);
    assert.strictEqual(capturedErr.code, 'TOKEN_MISSING');
  });

  it('falla con 401 TOKEN_INVALID si el formato no es Bearer', async () => {
    const req = { headers: { authorization: 'Basic 12345' } };
    let capturedErr = null;
    await requireAuth(req, {}, (err) => {
      capturedErr = err;
    });

    assert.ok(capturedErr);
    assert.strictEqual(capturedErr.statusCode, 401);
    assert.strictEqual(capturedErr.code, 'TOKEN_INVALID');
  });

  it('falla con 401 TOKEN_INVALID si el token está manipulado', async () => {
    const req = { headers: { authorization: 'Bearer token.invalido.manipulado' } };
    let capturedErr = null;
    await requireAuth(req, {}, (err) => {
      capturedErr = err;
    });

    assert.ok(capturedErr);
    assert.strictEqual(capturedErr.statusCode, 401);
    assert.strictEqual(capturedErr.code, 'TOKEN_INVALID');
  });

  it('falla con 401 TOKEN_EXPIRED si el token ha expirado', async () => {
    const expiredToken = signToken({ sub: '1', username: 'admin' }, { expiresIn: '-1s' });
    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    let capturedErr = null;
    await requireAuth(req, {}, (err) => {
      capturedErr = err;
    });

    assert.ok(capturedErr);
    assert.strictEqual(capturedErr.statusCode, 401);
    assert.strictEqual(capturedErr.code, 'TOKEN_EXPIRED');
  });

  it('inyecta req.user cuando el token es válido y el usuario está activo en la BD', async () => {
    authRepository.findById = async (id) => ({
      id,
      username: 'admin',
      full_name: 'Admin Sistema',
      is_active: true,
    });

    const validToken = signToken({ sub: '1', username: 'admin' });
    const req = { headers: { authorization: `Bearer ${validToken}` } };
    let capturedErr = null;
    await requireAuth(req, {}, (err) => {
      capturedErr = err;
    });

    assert.strictEqual(capturedErr, undefined);
    assert.deepStrictEqual(req.user, {
      id: '1',
      username: 'admin',
      fullName: 'Admin Sistema',
    });
  });
});
