import { salesRepository } from './sales.repository.js';
import { withTransaction } from '../../db/pool.js';
import { getTodayLima, closeOverdueSalesDays } from '../../utils/date.js';
import { AppError } from '../../utils/AppError.js';
import { ERROR_CODES } from '../../config/constants.js';

export const salesService = {
  async createSale({ items }, userId) {
    return withTransaction(async (client) => {
      // 1. Ejecutar cierre perezoso
      await closeOverdueSalesDays(client);

      // 2. Obtener fecha actual de Lima y bloquear la jornada de hoy
      const todayLima = await getTodayLima(client);
      const salesDay = await salesRepository.lockSalesDayByDate(client, todayLima);

      if (!salesDay) {
        throw new AppError(
          409,
          ERROR_CODES.DAY_NOT_STARTED,
          'No hay una jornada iniciada para hoy'
        );
      }

      if (salesDay.status !== 'open') {
        throw new AppError(
          409,
          ERROR_CODES.DAY_CLOSED,
          'La jornada de hoy se encuentra cerrada'
        );
      }

      // 3. Validar sabores involucrados con bloqueo FOR SHARE
      const uniqueFlavorIds = Array.from(new Set(items.flatMap((item) => item.flavorIds)));
      const flavorsInDb = await salesRepository.lockFlavorsByIds(client, uniqueFlavorIds);

      // Comprobar existencia y estado activo
      const foundActiveMap = new Map(
        flavorsInDb.filter((f) => f.isActive).map((f) => [f.id, f])
      );
      const missingFlavorIds = uniqueFlavorIds.filter((id) => !foundActiveMap.has(id));

      if (missingFlavorIds.length > 0) {
        throw new AppError(
          400,
          ERROR_CODES.FLAVOR_NOT_FOUND,
          'Uno o más sabores no existen o no se encuentran activos',
          missingFlavorIds.map((id) => ({ flavorId: id, message: 'Sabor inexistente o inactivo' }))
        );
      }

      // Comprobar estado de agotado
      const soldOutFlavors = flavorsInDb.filter((f) => f.isSoldOut);
      if (soldOutFlavors.length > 0) {
        throw new AppError(
          409,
          ERROR_CODES.FLAVOR_SOLD_OUT,
          'Uno o más sabores seleccionados se encuentran agotados',
          soldOutFlavors.map((f) => ({ id: f.id, name: f.name }))
        );
      }

      // 4. Leer precio por vaso de app_settings dentro de la misma transacción
      const cupPrice = await salesRepository.getCupPrice(client);

      // 5. Insertar cabecera de la venta
      const saleRecord = await salesRepository.createSaleRecord(client, {
        salesDayId: salesDay.id,
        createdBy: userId,
      });

      // 6. Insertar cada vaso (sale_items) y sus sabores asociados (sale_item_flavors)
      for (const item of items) {
        const saleItem = await salesRepository.createSaleItem(client, {
          saleId: saleRecord.id,
          quantity: item.quantity,
          unitPrice: cupPrice,
        });

        for (const flavorId of item.flavorIds) {
          await salesRepository.createSaleItemFlavor(client, {
            saleItemId: saleItem.id,
            flavorId,
          });
        }
      }

      // 7. Retornar la venta completa estructurada (el trigger recalcula sales.total)
      return salesRepository.getSaleWithDetails(client, saleRecord.id);
    });
  },
};
