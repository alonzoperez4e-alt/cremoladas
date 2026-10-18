// Preconfigurar variables de entorno antes de importar cualquier módulo
process.env.NODE_ENV = 'test';
process.env.PORT = '4003';
process.env.DATABASE_URL =
  'postgresql://fake_user:fake_password@ep-fake.us-east-2.aws.neon.tech/neondb?sslmode=require';
process.env.JWT_SECRET = 'this_is_a_very_secure_test_jwt_secret_with_more_than_32_characters';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.ENABLE_CRON = 'false';

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const { toCents } = await import('../src/utils/balance.js');
const { preparationsService } = await import('../src/modules/preparations/preparations.service.js');
const { preparationsRepository } = await import('../src/modules/preparations/preparations.repository.js');
const { expensesService } = await import('../src/modules/expenses/expenses.service.js');
const { expensesRepository } = await import('../src/modules/expenses/expenses.repository.js');
const { withdrawalsService } = await import('../src/modules/withdrawals/withdrawals.service.js');
const { withdrawalsRepository } = await import('../src/modules/withdrawals/withdrawals.repository.js');
const { transactionsService } = await import('../src/modules/transactions/transactions.service.js');
const { transactionsRepository } = await import('../src/modules/transactions/transactions.repository.js');
const { statsRepository } = await import('../src/modules/stats/stats.repository.js');
const { flavorsRepository } = await import('../src/modules/flavors/flavors.repository.js');
const { materialsRepository } = await import('../src/modules/materials/materials.repository.js');
const poolModule = await import('../src/db/pool.js');

describe('13. Módulo de Saldos, Transacciones y Retiros', () => {
  beforeEach(() => {
    // Reset mocks
    flavorsRepository.findById = async (id) => ({ id, name: 'Maracuyá', isActive: true, isSoldOut: false });
    materialsRepository.findById = async (id) => ({ id, name: 'Vasos', isActive: true });
  });

  it('toCents convierte números flotantes a enteros de centavos de manera exacta', () => {
    assert.strictEqual(toCents(10.5), 1050);
    assert.strictEqual(toCents(0.1 + 0.2), 30);
    assert.strictEqual(toCents(19.99), 1999);
  });

  it('rechaza preparación si la suma del pago no coincide con el monto (400 PAYMENT_SUM_MISMATCH)', async () => {
    await assert.rejects(
      async () => {
        await preparationsService.create(
          {
            flavorId: 1,
            investmentAmount: 50.0,
            payment: { cashAmount: 30.0, yapeAmount: 15.0, ownAmount: 0.0 }, // suma 45 != 50
          },
          1
        );
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'PAYMENT_SUM_MISMATCH');
        return true;
      }
    );
  });

  it('rechaza gasto si la suma del pago no coincide con el monto (400 PAYMENT_SUM_MISMATCH)', async () => {
    await assert.rejects(
      async () => {
        await expensesService.create(
          {
            materialId: 1,
            amount: 25.0,
            payment: { cashAmount: 10.0, yapeAmount: 10.0, ownAmount: 0.0 }, // suma 20 != 25
          },
          1
        );
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'PAYMENT_SUM_MISMATCH');
        return true;
      }
    );
  });

  it('pago con efectivo mayor al saldo disponible lanza 409 INSUFFICIENT_BALANCE', async () => {
    poolModule.setTransactionRunnerForTesting(async (cb) => {
      let callCount = 0;
      const mockClient = {
        query: async (sql) => {
          if (sql && sql.includes('v_account_balances')) {
            callCount++;
            if (callCount === 1) {
              // Pre-balances: saldo en efectivo 20
              return {
                rows: [
                  {
                    cash_revenue: 20,
                    yape_revenue: 50,
                    cash_invested: 0,
                    yape_invested: 0,
                    own_invested: 0,
                    cash_withdrawn: 0,
                    yape_withdrawn: 0,
                    profit_withdrawn: 0,
                    reimbursed: 0,
                    cash_balance: 20,
                    yape_balance: 50,
                    pending_reimbursement: 0,
                  },
                ],
              };
            }
            // Post-balances tras intentar gastar 30 de efectivo: cash_balance queda en -10
            return {
              rows: [
                {
                  cash_revenue: 20,
                  yape_revenue: 50,
                  cash_invested: 30,
                  yape_invested: 0,
                  own_invested: 0,
                  cash_withdrawn: 0,
                  yape_withdrawn: 0,
                  profit_withdrawn: 0,
                  reimbursed: 0,
                  cash_balance: -10,
                  yape_balance: 50,
                  pending_reimbursement: 0,
                },
              ],
            };
          }
          return { rows: [] };
        },
      };
      return cb(mockClient);
    });

    preparationsRepository.create = async () => ({ id: 1 });

    await assert.rejects(
      async () => {
        await preparationsService.create(
          {
            flavorId: 1,
            investmentAmount: 30.0,
            payment: { cashAmount: 30.0, yapeAmount: 0, ownAmount: 0 },
          },
          1
        );
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'INSUFFICIENT_BALANCE');
        assert.strictEqual(err.details.account, 'cash');
        assert.strictEqual(err.details.available, 20);
        assert.strictEqual(err.details.requested, 30);
        return true;
      }
    );
  });

  it('pago mixto correcto guarda y descuenta de efectivo y Yape', async () => {
    let capturedInsert = null;
    poolModule.setTransactionRunnerForTesting(async (cb) => {
      const mockClient = {
        query: async (sql) => {
          if (sql && sql.includes('v_account_balances')) {
            return {
              rows: [
                {
                  cash_revenue: 100,
                  yape_revenue: 100,
                  cash_invested: 20,
                  yape_invested: 10,
                  own_invested: 0,
                  cash_withdrawn: 0,
                  yape_withdrawn: 0,
                  profit_withdrawn: 0,
                  reimbursed: 0,
                  cash_balance: 80,
                  yape_balance: 90,
                  pending_reimbursement: 0,
                },
              ],
            };
          }
          return { rows: [] };
        },
      };
      return cb(mockClient);
    });

    expensesRepository.create = async (data) => {
      capturedInsert = data;
      return { id: 99, ...data };
    };

    const res = await expensesService.create(
      {
        materialId: 1,
        amount: 30.0,
        payment: { cashAmount: 20.0, yapeAmount: 10.0, ownAmount: 0.0 },
      },
      1
    );

    assert.strictEqual(capturedInsert.paidCash, 20.0);
    assert.strictEqual(capturedInsert.paidYape, 10.0);
    assert.strictEqual(capturedInsert.paidOwn, 0.0);
    assert.strictEqual(res.amount, 30.0);
  });

  it('inversión de bolsillo propio (own) no altera saldos y genera aporte pendiente', async () => {
    let capturedInsert = null;
    poolModule.setTransactionRunnerForTesting(async (cb) => {
      const mockClient = {
        query: async (sql) => {
          if (sql && sql.includes('v_account_balances')) {
            return {
              rows: [
                {
                  cash_revenue: 50,
                  yape_revenue: 50,
                  cash_invested: 0,
                  yape_invested: 0,
                  own_invested: 40,
                  cash_withdrawn: 0,
                  yape_withdrawn: 0,
                  profit_withdrawn: 0,
                  reimbursed: 0,
                  cash_balance: 50,
                  yape_balance: 50,
                  pending_reimbursement: 40,
                },
              ],
            };
          }
          return { rows: [] };
        },
      };
      return cb(mockClient);
    });

    preparationsRepository.create = async (data) => {
      capturedInsert = data;
      return { id: 2, ...data };
    };

    const res = await preparationsService.create(
      {
        flavorId: 1,
        investmentAmount: 40.0,
        payment: { cashAmount: 0, yapeAmount: 0, ownAmount: 40.0 },
      },
      1
    );

    assert.strictEqual(capturedInsert.paidOwn, 40.0);
    assert.strictEqual(capturedInsert.paidCash, 0);
    assert.strictEqual(capturedInsert.paidYape, 0);
    assert.strictEqual(res.id, 2);
  });

  it('retiro de ganancias que excede availableProfit lanza 409 EXCEEDS_AVAILABLE_PROFIT sin confirmar', async () => {
    poolModule.setTransactionRunnerForTesting(async (cb) => {
      const mockClient = {
        query: async (sql) => {
          if (sql && sql.includes('v_account_balances')) {
            return {
              rows: [
                {
                  cash_revenue: 50,
                  yape_revenue: 50,
                  cash_invested: 20,
                  yape_invested: 20,
                  own_invested: 0,
                  cash_withdrawn: 0,
                  yape_withdrawn: 0,
                  profit_withdrawn: 0,
                  reimbursed: 0,
                  cash_balance: 30,
                  yape_balance: 30,
                  pending_reimbursement: 0,
                },
              ],
            };
          }
          return { rows: [] };
        },
      };
      return cb(mockClient);
    });

    // Total rev = 100, Total inv = 40 => netProfit = 60, availableProfit = 60
    // Intentar retirar 80 > 60 sin confirmCapitalUse:
    await assert.rejects(
      async () => {
        await withdrawalsService.create(
          {
            kind: 'profit',
            cashAmount: 40.0,
            yapeAmount: 40.0, // total = 80
            confirmCapitalUse: false,
          },
          1
        );
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'EXCEEDS_AVAILABLE_PROFIT');
        assert.strictEqual(err.details.availableProfit, 60);
        assert.strictEqual(err.details.requested, 80);
        assert.strictEqual(err.details.excess, 20);
        return true;
      }
    );
  });

  it('retiro de ganancias que excede availableProfit con confirmCapitalUse=true es permitido y devuelve capitalUsed', async () => {
    poolModule.setTransactionRunnerForTesting(async (cb) => {
      const mockClient = {
        query: async (sql) => {
          if (sql && sql.includes('v_account_balances')) {
            return {
              rows: [
                {
                  cash_revenue: 100,
                  yape_revenue: 100,
                  cash_invested: 20,
                  yape_invested: 20,
                  own_invested: 0,
                  cash_withdrawn: 0,
                  yape_withdrawn: 0,
                  profit_withdrawn: 0,
                  reimbursed: 0,
                  cash_balance: 80,
                  yape_balance: 80,
                  pending_reimbursement: 0,
                },
              ],
            };
          }
          return { rows: [] };
        },
      };
      return cb(mockClient);
    });

    // netProfit = 200 - 40 = 160. Retiramos 180 => capitalUsed = 20.
    withdrawalsRepository.create = async (data) => ({
      id: 10,
      kind: data.kind,
      cashAmount: data.cashAmount,
      yapeAmount: data.yapeAmount,
      total: data.cashAmount + data.yapeAmount,
      withdrawalDate: '2026-10-18',
    });

    const res = await withdrawalsService.create(
      {
        kind: 'profit',
        cashAmount: 90.0,
        yapeAmount: 90.0,
        confirmCapitalUse: true,
      },
      1
    );

    assert.strictEqual(res.id, 10);
    assert.strictEqual(res.capitalUsed, 20.0);
  });

  it('devolución de aporte propio mayor que lo pendiente lanza 409 REIMBURSEMENT_EXCEEDS_PENDING', async () => {
    poolModule.setTransactionRunnerForTesting(async (cb) => {
      let count = 0;
      const mockClient = {
        query: async (sql) => {
          if (sql && sql.includes('v_account_balances')) {
            count++;
            if (count === 1) {
              return {
                rows: [
                  {
                    cash_revenue: 100,
                    yape_revenue: 100,
                    cash_invested: 0,
                    yape_invested: 0,
                    own_invested: 25,
                    cash_withdrawn: 0,
                    yape_withdrawn: 0,
                    profit_withdrawn: 0,
                    reimbursed: 0,
                    cash_balance: 100,
                    yape_balance: 100,
                    pending_reimbursement: 25,
                  },
                ],
              };
            }
            // Post insert: pending_reimbursement queda en -5
            return {
              rows: [
                {
                  cash_revenue: 100,
                  yape_revenue: 100,
                  cash_invested: 0,
                  yape_invested: 0,
                  own_invested: 25,
                  cash_withdrawn: 30,
                  yape_withdrawn: 0,
                  profit_withdrawn: 0,
                  reimbursed: 30,
                  cash_balance: 70,
                  yape_balance: 100,
                  pending_reimbursement: -5,
                },
              ],
            };
          }
          return { rows: [] };
        },
      };
      return cb(mockClient);
    });

    withdrawalsRepository.create = async () => ({ id: 11 });

    await assert.rejects(
      async () => {
        await withdrawalsService.create(
          {
            kind: 'reimbursement',
            cashAmount: 30.0, // mayor que los 25 pendientes
            yapeAmount: 0,
          },
          1
        );
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'REIMBURSEMENT_EXCEEDS_PENDING');
        assert.strictEqual(err.details.pending, 25);
        return true;
      }
    );
  });

  it('retiro mayor que el saldo de la cuenta lanza 409 INSUFFICIENT_BALANCE', async () => {
    poolModule.setTransactionRunnerForTesting(async (cb) => {
      let count = 0;
      const mockClient = {
        query: async (sql) => {
          if (sql && sql.includes('v_account_balances')) {
            count++;
            if (count === 1) {
              return {
                rows: [
                  {
                    cash_revenue: 20,
                    yape_revenue: 50,
                    cash_invested: 0,
                    yape_invested: 0,
                    own_invested: 0,
                    cash_withdrawn: 0,
                    yape_withdrawn: 0,
                    profit_withdrawn: 0,
                    reimbursed: 0,
                    cash_balance: 20,
                    yape_balance: 50,
                    pending_reimbursement: 0,
                  },
                ],
              };
            }
            return {
              rows: [
                {
                  cash_revenue: 20,
                  yape_revenue: 50,
                  cash_invested: 0,
                  yape_invested: 0,
                  own_invested: 0,
                  cash_withdrawn: 0,
                  yape_withdrawn: 60,
                  profit_withdrawn: 60,
                  reimbursed: 0,
                  cash_balance: 20,
                  yape_balance: -10, // saldo negativo en Yape
                  pending_reimbursement: 0,
                },
              ],
            };
          }
          return { rows: [] };
        },
      };
      return cb(mockClient);
    });

    withdrawalsRepository.create = async () => ({ id: 12 });

    await assert.rejects(
      async () => {
        await withdrawalsService.create(
          {
            kind: 'profit',
            cashAmount: 0,
            yapeAmount: 60.0,
            confirmCapitalUse: true,
          },
          1
        );
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'INSUFFICIENT_BALANCE');
        assert.strictEqual(err.details.account, 'yape');
        assert.strictEqual(err.details.available, 50);
        assert.strictEqual(err.details.requested, 60);
        return true;
      }
    );
  });

  it('identidad matemática obligatoria se cumple exactamente: balances.total = netProfit + investmentBySource.own - withdrawals.total', async () => {
    // Escenario numérico arbitrario:
    // Ventas: cash 500, yape 300 => rev = 800
    // Inversiones: cash 150, yape 100, own 200 => inv = 450
    // Retiros: cash 50, yape 30 (profit = 60, reimbursement = 20) => wth = 80
    // Saldos:
    // cash_balance = 500 - 150 - 50 = 300
    // yape_balance = 300 - 100 - 30 = 170
    // balances.total = 300 + 170 = 470
    // netProfit = 800 - 450 = 350
    // formula: netProfit (350) + own (200) - withdrawals (80) = 470.
    const fakeBalancesRow = {
      cash_revenue: '500.00',
      yape_revenue: '300.00',
      cash_invested: '150.00',
      yape_invested: '100.00',
      own_invested: '200.00',
      cash_withdrawn: '50.00',
      yape_withdrawn: '30.00',
      profit_withdrawn: '60.00',
      reimbursed: '20.00',
      cash_balance: '300.00',
      yape_balance: '170.00',
      pending_reimbursement: '180.00',
    };

    poolModule.setTransactionRunnerForTesting(null);
    statsRepository.getBusinessSummary = async () => {
      const b = fakeBalancesRow;
      const cashRevenue = Number(b.cash_revenue);
      const yapeRevenue = Number(b.yape_revenue);
      const cashInvested = Number(b.cash_invested);
      const yapeInvested = Number(b.yape_invested);
      const ownInvested = Number(b.own_invested);
      const cashWithdrawn = Number(b.cash_withdrawn);
      const yapeWithdrawn = Number(b.yape_withdrawn);
      const profitWithdrawn = Number(b.profit_withdrawn);
      const reimbursed = Number(b.reimbursed);
      const cashBalance = Number(b.cash_balance);
      const yapeBalance = Number(b.yape_balance);
      const pendingReimbursement = Number(b.pending_reimbursement);

      const totalRevenue = Number((cashRevenue + yapeRevenue).toFixed(2));
      const totalInvestment = Number((cashInvested + yapeInvested + ownInvested).toFixed(2));
      const netProfit = Number((totalRevenue - totalInvestment).toFixed(2));
      const availableProfit = Number((netProfit - profitWithdrawn).toFixed(2));

      const totalWithdrawn = Number((cashWithdrawn + yapeWithdrawn).toFixed(2));
      const totalBalance = Number((cashBalance + yapeBalance).toFixed(2));

      return {
        totalInvestment,
        totalRevenue,
        netProfit,
        investmentBreakdown: { preparations: 300, expenses: 150 },
        revenueByPaymentMethod: { cash: cashRevenue, yape: yapeRevenue },
        investmentBySource: { cash: cashInvested, yape: yapeInvested, own: ownInvested },
        withdrawals: { total: totalWithdrawn, profit: profitWithdrawn, reimbursement: reimbursed },
        balances: { cash: cashBalance, yape: yapeBalance, total: totalBalance },
        availableProfit,
        pendingReimbursement,
      };
    };

    const stats = await statsRepository.getBusinessSummary();

    const expectedTotalBalance = Number(
      (stats.netProfit + stats.investmentBySource.own - stats.withdrawals.total).toFixed(2)
    );
    assert.strictEqual(stats.balances.total, expectedTotalBalance);
  });

  it('historial de transacciones resume totalIn y totalOut correctamente y valida rango de fechas', async () => {
    transactionsRepository.findPaginated = async () => ({
      items: [
        {
          id: 'income-1-cash',
          date: '2026-10-18',
          type: 'income',
          account: 'cash',
          amount: 50.0,
          effect: 'in',
          title: 'Ventas del día',
        },
        {
          id: 'prep-1-cash',
          date: '2026-10-18',
          type: 'investment',
          account: 'cash',
          amount: 20.0,
          effect: 'out',
          title: 'Preparación · Fresa',
        },
      ],
      total: 2,
      totalIn: 50.0,
      totalOut: 20.0,
    });

    const res = await transactionsService.getPaginated({ page: 1, pageSize: 20 });
    assert.strictEqual(res.items.length, 2);
    assert.strictEqual(res.summary.totalIn, 50.0);
    assert.strictEqual(res.summary.totalOut, 20.0);

    // from > to debe fallar con 400
    await assert.rejects(
      async () => {
        await transactionsService.getPaginated({ from: '2026-10-19', to: '2026-10-18' });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'VALIDATION_ERROR');
        return true;
      }
    );
  });
});
