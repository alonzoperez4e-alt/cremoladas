import { withdrawalsRepository } from './withdrawals.repository.js';
import { getTodayLima } from '../../utils/date.js';
import { AppError } from '../../utils/AppError.js';
import { ERROR_CODES } from '../../config/constants.js';
import { withTransaction } from '../../db/pool.js';
import { lockBalances, getBalances, assertInvariants, toCents } from '../../utils/balance.js';

export const withdrawalsService = {
  async create({ kind, cashAmount, yapeAmount, withdrawalDate, description, confirmCapitalUse = false }, userId) {
    const todayLima = await getTodayLima();
    const finalDate = withdrawalDate || todayLima;

    if (finalDate > todayLima) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'La fecha de retiro no puede ser posterior a la fecha actual (Lima)'
      );
    }

    return withTransaction(async (client) => {
      await lockBalances(client);
      const preBalances = await getBalances(client);

      const requestedCents = toCents(cashAmount) + toCents(yapeAmount);
      let capitalUsed = 0;

      if (kind === 'profit') {
        const revCents = toCents(preBalances.cashRevenue) + toCents(preBalances.yapeRevenue);
        const invCents =
          toCents(preBalances.cashInvested) + toCents(preBalances.yapeInvested) + toCents(preBalances.ownInvested);
        const netProfitCents = revCents - invCents;
        const profitWithdrawnCents = toCents(preBalances.profitWithdrawn);
        const availableProfitCents = netProfitCents - profitWithdrawnCents;
        const availableProfit = availableProfitCents / 100;
        const maxAvailableCents = Math.max(0, availableProfitCents);

        if (requestedCents > maxAvailableCents) {
          const excessCents = requestedCents - maxAvailableCents;
          if (!confirmCapitalUse) {
            throw new AppError(
              409,
              ERROR_CODES.EXCEEDS_AVAILABLE_PROFIT,
              'El monto a retirar excede la ganancia disponible',
              {
                availableProfit,
                requested: requestedCents / 100,
                excess: excessCents / 100,
              }
            );
          }
          capitalUsed = excessCents / 100;
        }
      }

      const created = await withdrawalsRepository.create(
        {
          kind,
          cashAmount,
          yapeAmount,
          withdrawalDate: finalDate,
          description: description || null,
          createdBy: userId,
        },
        client
      );

      await assertInvariants(client, {
        preBalances,
        requestedCash: cashAmount,
        requestedYape: yapeAmount,
      });

      return {
        ...created,
        capitalUsed,
      };
    });
  },

  async delete(id) {
    return withTransaction(async (client) => {
      await lockBalances(client);
      const existing = await withdrawalsRepository.findById(id, client);
      if (!existing) {
        throw new AppError(404, ERROR_CODES.WITHDRAWAL_NOT_FOUND, 'El retiro solicitado no existe');
      }

      const preBalances = await getBalances(client);

      await withdrawalsRepository.delete(id, client);

      await assertInvariants(client, { preBalances });

      return { message: 'Retiro eliminado exitosamente' };
    });
  },
};
