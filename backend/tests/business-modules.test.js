// Preconfigurar variables de entorno antes de importar cualquier módulo
process.env.NODE_ENV = 'test';
process.env.PORT = '4002';
process.env.DATABASE_URL =
  'postgresql://fake_user:fake_password@ep-fake.us-east-2.aws.neon.tech/neondb?sslmode=require';
process.env.JWT_SECRET = 'this_is_a_very_secure_test_jwt_secret_with_more_than_32_characters';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.ENABLE_CRON = 'false'; // Desactivar timers en tests

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

const { createApp } = await import('../src/app.js');
const { signToken } = await import('../src/utils/jwt.js');
const { authRepository } = await import('../src/modules/auth/auth.repository.js');
const { flavorsService } = await import('../src/modules/flavors/flavors.service.js');
const { flavorsRepository } = await import('../src/modules/flavors/flavors.repository.js');
const { materialsService } = await import('../src/modules/materials/materials.service.js');
const { materialsRepository } = await import('../src/modules/materials/materials.repository.js');
const { expensesService } = await import('../src/modules/expenses/expenses.service.js');
const { expensesRepository } = await import('../src/modules/expenses/expenses.repository.js');
const { preparationsService } = await import('../src/modules/preparations/preparations.service.js');
const { preparationsRepository } = await import('../src/modules/preparations/preparations.repository.js');
const { salesDaysService } = await import('../src/modules/sales-days/sales-days.service.js');
const { salesDaysRepository } = await import('../src/modules/sales-days/sales-days.repository.js');
const { salesService } = await import('../src/modules/sales/sales.service.js');
const { salesRepository } = await import('../src/modules/sales/sales.repository.js');
const { statsService } = await import('../src/modules/stats/stats.service.js');
const { statsRepository } = await import('../src/modules/stats/stats.repository.js');
const poolModule = await import('../src/db/pool.js');

describe('7. Módulo de Sabores (Flavors)', () => {
  it('detecta nombres duplicados sin distinguir mayúsculas', async () => {
    flavorsRepository.findActiveByName = async (name) => {
      if (name.toLowerCase() === 'maracuyá') {
        return { id: 1, name: 'Maracuyá', color: '#FFA500', icon: 'fruit-orange', isSoldOut: false, isActive: true };
      }
      return null;
    };

    await assert.rejects(
      async () => {
        await flavorsService.create({ name: 'maracuyá', color: '#FFA500', icon: 'fruit-orange' });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'FLAVOR_NAME_EXISTS');
        return true;
      }
    );
  });

  it('permite consultar solo disponibles con available=true', async () => {
    flavorsRepository.findAll = async ({ availableOnly }) => {
      const list = [
        { id: 1, name: 'Fresa', color: '#FF0000', icon: 'fruit-red', isSoldOut: false, isActive: true },
        { id: 2, name: 'Mango', color: '#FFAA00', icon: 'fruit-yellow', isSoldOut: true, isActive: true },
      ];
      return availableOnly ? list.filter((f) => !f.isSoldOut) : list;
    };

    const all = await flavorsService.getAll({ availableOnly: false });
    assert.strictEqual(all.length, 2);

    const available = await flavorsService.getAll({ availableOnly: true });
    assert.strictEqual(available.length, 1);
    assert.strictEqual(available[0].name, 'Fresa');
  });

  it('marcar sabor como agotado actualiza isSoldOut', async () => {
    flavorsRepository.findById = async () => ({ id: 1, name: 'Fresa', isSoldOut: false, isActive: true });
    flavorsRepository.updateSoldOut = async (id, isSoldOut) => ({
      id,
      name: 'Fresa',
      color: '#FF0000',
      icon: 'strawberry',
      isSoldOut,
      isActive: true,
    });

    const updated = await flavorsService.setSoldOut(1, true);
    assert.strictEqual(updated.isSoldOut, true);
  });
});

describe('8. Módulo de Materiales y Gastos (Materials & Expenses)', () => {
  it('crear material con nombre duplicado retorna 409 MATERIAL_NAME_EXISTS', async () => {
    materialsRepository.findActiveByName = async () => ({ id: 1, name: 'Vasos 8oz', isActive: true });

    await assert.rejects(
      async () => {
        await materialsService.create({ name: 'vasos 8oz' });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'MATERIAL_NAME_EXISTS');
        return true;
      }
    );
  });

  it('gasto con material inexistente lanza 400 MATERIAL_NOT_FOUND', async () => {
    materialsRepository.findById = async () => null;

    await assert.rejects(
      async () => {
        await expensesService.create({ materialId: 999, amount: 50.0 }, 1);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'MATERIAL_NOT_FOUND');
        return true;
      }
    );
  });

  it('summary.totalAmount en gastos refleja el conjunto total filtrado', async () => {
    expensesRepository.findPaginated = async () => ({
      items: [
        { id: 1, materialId: 1, materialName: 'Vasos', expenseDate: '2026-10-18', amount: 50, description: null },
      ],
      total: 10,
      totalAmount: 500,
    });

    const res = await expensesService.getPaginated({ page: 1, pageSize: 1 });
    assert.strictEqual(res.items.length, 1);
    assert.strictEqual(res.pagination.total, 10);
    assert.strictEqual(res.summary.totalAmount, 500);
  });
});

describe('9. Módulo de Preparaciones (Preparations)', () => {
  it('preparación con sabor inexistente lanza 400 FLAVOR_NOT_FOUND', async () => {
    flavorsRepository.findById = async () => null;

    await assert.rejects(
      async () => {
        await preparationsService.create({ flavorId: 888, investmentAmount: 30.0 }, 1);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'FLAVOR_NOT_FOUND');
        return true;
      }
    );
  });

  it('un sabor agotado SÍ puede recibir preparaciones', async () => {
    flavorsRepository.findById = async (id) => ({
      id,
      name: 'Lúcuma',
      isSoldOut: true, // Agotado
      isActive: true,
    });
    preparationsRepository.create = async (data) => ({
      id: 1,
      flavorId: data.flavorId,
      flavorName: 'Lúcuma',
      investmentAmount: data.investmentAmount,
      prepDate: data.prepDate,
    });

    const res = await preparationsService.create({ flavorId: 5, investmentAmount: 45.0 }, 1);
    assert.strictEqual(res.flavorName, 'Lúcuma');
    assert.strictEqual(res.investmentAmount, 45.0);
  });
});

describe('10. Módulo de Jornadas y Ventas (Sales Days & Sales)', () => {
  it('iniciar la jornada de hoy cuando ya existe arroja 409 DAY_ALREADY_STARTED', async () => {
    salesDaysRepository.findByDate = async () => ({ id: 1, status: 'open' });

    await assert.rejects(
      async () => {
        await salesDaysService.startTodayDay(1);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'DAY_ALREADY_STARTED');
        return true;
      }
    );
  });

  it('cerrar una jornada ya cerrada arroja 409 DAY_ALREADY_CLOSED', async () => {
    salesDaysRepository.findByDate = async () => ({ id: 1, status: 'closed' });

    await assert.rejects(
      async () => {
        await salesDaysService.closeTodayDay();
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'DAY_ALREADY_CLOSED');
        return true;
      }
    );
  });

  it('registrar venta sin jornada arroja 409 DAY_NOT_STARTED', async () => {
    poolModule.setTransactionRunnerForTesting(async (cb) => {
      const mockClient = { query: async () => ({ rows: [] }) };
      return cb(mockClient);
    });
    salesRepository.lockSalesDayByDate = async () => null;

    await assert.rejects(
      async () => {
        await salesService.createSale(
          { items: [{ flavorIds: [1], quantity: 2 }] },
          1
        );
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'DAY_NOT_STARTED');
        return true;
      }
    );
  });

  it('registrar venta con jornada cerrada arroja 409 DAY_CLOSED', async () => {
    poolModule.setTransactionRunnerForTesting(async (cb) => {
      const mockClient = { query: async () => ({ rows: [] }) };
      return cb(mockClient);
    });
    salesRepository.lockSalesDayByDate = async () => ({ id: 1, status: 'closed' });

    await assert.rejects(
      async () => {
        await salesService.createSale(
          { items: [{ flavorIds: [1], quantity: 2 }] },
          1
        );
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'DAY_CLOSED');
        return true;
      }
    );
  });

  it('registrar venta con un sabor agotado arroja 409 FLAVOR_SOLD_OUT', async () => {
    poolModule.setTransactionRunnerForTesting(async (cb) => {
      const mockClient = { query: async () => ({ rows: [] }) };
      return cb(mockClient);
    });
    salesRepository.lockSalesDayByDate = async () => ({ id: 1, status: 'open' });
    salesRepository.lockFlavorsByIds = async () => [
      { id: 1, name: 'Maracuyá', isSoldOut: true, isActive: true },
    ];

    await assert.rejects(
      async () => {
        await salesService.createSale(
          { items: [{ flavorIds: [1], quantity: 1 }] },
          1
        );
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'FLAVOR_SOLD_OUT');
        assert.strictEqual(err.details[0].name, 'Maracuyá');
        return true;
      }
    );
  });

  it('venta calcula el total correctamente (3 vasos x S/ 2.00 = S/ 6.00)', async () => {
    let capturedUnitPrices = [];

    poolModule.setTransactionRunnerForTesting(async (cb) => {
      const mockClient = { query: async () => ({ rows: [] }) };
      return cb(mockClient);
    });
    salesRepository.lockSalesDayByDate = async () => ({ id: 1, status: 'open' });
    salesRepository.lockFlavorsByIds = async () => [
      { id: 1, name: 'Fresa', isSoldOut: false, isActive: true },
      { id: 2, name: 'Mango', isSoldOut: false, isActive: true },
      { id: 3, name: 'Maracuyá', isSoldOut: false, isActive: true },
    ];
    salesRepository.getCupPrice = async () => 2.0; // Precio configurado en app_settings
    salesRepository.createSaleRecord = async () => ({ id: 10, total: 0, createdAt: new Date() });
    salesRepository.createSaleItem = async (client, { quantity, unitPrice }) => {
      capturedUnitPrices.push(unitPrice);
      return { id: Math.random(), quantity, unitPrice, subtotal: quantity * unitPrice };
    };
    salesRepository.createSaleItemFlavor = async () => {};
    salesRepository.getSaleWithDetails = async () => ({
      id: 10,
      total: 6.0,
      createdAt: new Date().toISOString(),
      items: [
        {
          id: 1,
          quantity: 1,
          unitPrice: 2.0,
          subtotal: 2.0,
          flavors: [
            { id: 1, name: 'Fresa' },
            { id: 2, name: 'Mango' },
            { id: 3, name: 'Maracuyá' },
          ],
        },
        {
          id: 2,
          quantity: 2,
          unitPrice: 2.0,
          subtotal: 4.0,
          flavors: [{ id: 1, name: 'Fresa' }],
        },
      ],
    });

    const sale = await salesService.createSale(
      {
        items: [
          { flavorIds: [1, 2, 3], quantity: 1 }, // 1 vaso surtido (3 sabores) = S/ 2.00
          { flavorIds: [1], quantity: 2 },       // 2 vasos simples = S/ 4.00
        ],
      },
      1
    );

    assert.strictEqual(sale.total, 6.0);
    assert.deepStrictEqual(capturedUnitPrices, [2.0, 2.0]);
  });
});

describe('11. Módulo de Estadísticas (Stats)', () => {
  it('GET /api/stats/summary devuelve totales calculados y netProfit correcto', async () => {
    statsRepository.getBusinessSummary = async () => ({
      totalInvestment: 350.0,
      totalRevenue: 800.0,
      netProfit: 450.0,
      investmentBreakdown: {
        preparations: 200.0,
        expenses: 150.0,
      },
    });

    const summary = await statsService.getSummary();
    assert.strictEqual(summary.totalInvestment, 350.0);
    assert.strictEqual(summary.totalRevenue, 800.0);
    assert.strictEqual(summary.netProfit, 450.0);
    assert.strictEqual(summary.investmentBreakdown.preparations, 200.0);
    assert.strictEqual(summary.investmentBreakdown.expenses, 150.0);
  });
});

describe('12. Protección de Rutas HTTP con requireAuth', () => {
  let server;
  let baseUrl;
  let validToken;

  before(async () => {
    authRepository.findById = async (id) => ({
      id,
      username: 'admin',
      full_name: 'Administrador',
      is_active: true,
    });

    validToken = signToken({ sub: '1', username: 'admin' });

    const app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('Rutas protegidas rechazan peticiones sin token con 401 TOKEN_MISSING', async () => {
    const endpoints = [
      '/api/flavors',
      '/api/materials',
      '/api/expenses',
      '/api/preparations',
      '/api/sales-days/today',
      '/api/stats/summary',
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep}`);
      const body = await res.json();
      assert.strictEqual(res.status, 401, `Endpoint ${ep} debió responder 401`);
      assert.strictEqual(body.error.code, 'TOKEN_MISSING');
    }
  });

  it('Rutas protegidas aceptan peticiones con token válido', async () => {
    flavorsRepository.findAll = async () => [];

    const res = await fetch(`${baseUrl}/api/flavors`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data));
  });
});
