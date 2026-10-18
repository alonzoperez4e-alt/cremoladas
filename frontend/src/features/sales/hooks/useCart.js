import { useReducer, useEffect, useCallback } from 'react';
import { getTodayLima } from '../../../lib/dates';
import { CUP_PRICE_DISPLAY } from '../../../lib/config';
import { toast } from 'sonner';

const CART_STORAGE_PREFIX = 'cremoladas_cart_';

function getStorageKey() {
  return `${CART_STORAGE_PREFIX}${getTodayLima()}`;
}

// Carga inicial desde localStorage para la fecha de hoy en Lima
function getInitialCart() {
  try {
    const todayKey = getStorageKey();
    // Limpiar claves antiguas de otros días
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CART_STORAGE_PREFIX) && key !== todayKey) {
        localStorage.removeItem(key);
      }
    }

    const saved = localStorage.getItem(todayKey);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeFlavorIds(flavorIds) {
  return [...flavorIds].map(Number).sort((a, b) => a - b);
}

function areFlavorSetsEqual(setA, setB) {
  if (setA.length !== setB.length) return false;
  const sortedA = normalizeFlavorIds(setA);
  const sortedB = normalizeFlavorIds(setB);
  return sortedA.every((id, idx) => id === sortedB[idx]);
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_LINE': {
      const { flavorIds, quantity } = action.payload;
      const normalized = normalizeFlavorIds(flavorIds);

      // Buscar si ya existe una combinación idéntica de sabores (sin importar orden)
      const existingIndex = state.findIndex((line) =>
        areFlavorSetsEqual(line.flavorIds, normalized)
      );

      if (existingIndex >= 0) {
        const existing = state[existingIndex];
        const newTotalQty = existing.quantity + quantity;
        const cappedQty = Math.min(50, newTotalQty);

        if (newTotalQty > 50) {
          toast.warning('Se alcanzó el límite máximo de 50 vasos para esta combinación');
        }

        const updated = [...state];
        updated[existingIndex] = {
          ...existing,
          quantity: cappedQty,
          invalidReason: null, // Resetear invalidación si se re-agrega
        };
        return updated;
      }

      if (state.length >= 50) {
        toast.error('No se pueden agregar más de 50 tipos de vaso por venta');
        return state;
      }

      return [
        ...state,
        {
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          flavorIds: normalized,
          quantity: Math.min(50, Math.max(1, quantity)),
          invalidReason: null,
        },
      ];
    }

    case 'UPDATE_QUANTITY': {
      const { index, quantity } = action.payload;
      const capped = Math.min(50, Math.max(1, quantity));
      const updated = [...state];
      if (updated[index]) {
        updated[index] = { ...updated[index], quantity: capped };
      }
      return updated;
    }

    case 'REMOVE_LINE': {
      return state.filter((_, idx) => idx !== action.payload.index);
    }

    case 'CLEAR_CART': {
      return [];
    }

    case 'MARK_INVALID_FLAVORS': {
      const { invalidFlavorIds, reason } = action.payload;
      const invalidSet = new Set(invalidFlavorIds.map(Number));
      return state.map((line) => {
        const hasInvalid = line.flavorIds.some((id) => invalidSet.has(id));
        return hasInvalid ? { ...line, invalidReason: reason } : line;
      });
    }

    case 'REMOVE_INVALID_LINES': {
      return state.filter((line) => !line.invalidReason);
    }

    default:
      return state;
  }
}

export function useCart() {
  const [lines, dispatch] = useReducer(cartReducer, [], getInitialCart);

  // Persistir en localStorage ante cada cambio
  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(lines));
    } catch {
      // Ignorar errores de cuota en localStorage
    }
  }, [lines]);

  const addLine = useCallback((flavorIds, quantity = 1) => {
    if (!flavorIds || flavorIds.length === 0) return;
    dispatch({ type: 'ADD_LINE', payload: { flavorIds, quantity } });
  }, []);

  const updateQuantity = useCallback((index, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { index, quantity } });
  }, []);

  const removeLine = useCallback((index) => {
    dispatch({ type: 'REMOVE_LINE', payload: { index } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
    try {
      localStorage.removeItem(getStorageKey());
    } catch {
      // Ignorar
    }
  }, []);

  const markInvalidFlavors = useCallback((invalidFlavorIds, reason) => {
    dispatch({
      type: 'MARK_INVALID_FLAVORS',
      payload: { invalidFlavorIds, reason },
    });
  }, []);

  const removeInvalidLines = useCallback(() => {
    dispatch({ type: 'REMOVE_INVALID_LINES' });
  }, []);

  const totalCups = lines.reduce((acc, line) => acc + line.quantity, 0);
  const estimatedTotal = totalCups * CUP_PRICE_DISPLAY;
  const hasInvalidLines = lines.some((line) => Boolean(line.invalidReason));

  return {
    lines,
    totalCups,
    estimatedTotal,
    hasInvalidLines,
    addLine,
    updateQuantity,
    removeLine,
    clearCart,
    markInvalidFlavors,
    removeInvalidLines,
  };
}
