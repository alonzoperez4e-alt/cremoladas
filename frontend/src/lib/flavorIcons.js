/**
 * Catálogo de iconos de sabores y utilidades de visualización.
 * Cada clave debe cumplir ^[a-z0-9-]{1,50}$
 */

export const FLAVOR_ICONS = [
  { key: 'strawberry', emoji: '🍓', label: 'Fresa' },
  { key: 'pineapple', emoji: '🍍', label: 'Piña' },
  { key: 'citrus', emoji: '🍋', label: 'Limón' },
  { key: 'grape', emoji: '🍇', label: 'Uva' },
  { key: 'cherry', emoji: '🍒', label: 'Cereza' },
  { key: 'apple', emoji: '🍎', label: 'Manzana' },
  { key: 'green-apple', emoji: '🍏', label: 'Manzana verde' },
  { key: 'banana', emoji: '🍌', label: 'Plátano' },
  { key: 'orange', emoji: '🍊', label: 'Naranja' },
  { key: 'watermelon', emoji: '🍉', label: 'Sandía' },
  { key: 'peach', emoji: '🍑', label: 'Durazno' },
  { key: 'mango', emoji: '🥭', label: 'Mango' },
  { key: 'coconut', emoji: '🥥', label: 'Coco' },
  { key: 'kiwi', emoji: '🥝', label: 'Kiwi' },
  { key: 'blueberry', emoji: '🫐', label: 'Arándano' },
  { key: 'melon', emoji: '🍈', label: 'Melón' },
  { key: 'pear', emoji: '🍐', label: 'Pera' },
  { key: 'ice-cream', emoji: '🍦', label: 'Helado' },
  { key: 'shaved-ice', emoji: '🍧', label: 'Cremolada (clásico)' },
  { key: 'passion-fruit', emoji: '🍈', label: 'Maracuyá' },
  { key: 'lucuma', emoji: '🥑', label: 'Lúcuma' },
  { key: 'chicha', emoji: '🌽', label: 'Chicha morada' },
];

export const DEFAULT_FLAVOR_ICON = '🍧';

const ICON_MAP = FLAVOR_ICONS.reduce((acc, item) => {
  acc[item.key] = item.emoji;
  return acc;
}, {});

/**
 * Traduce una clave de icono al emoji correspondiente.
 * Si no existe, devuelve el icono por defecto 🍧.
 */
export function getFlavorIcon(key) {
  if (!key) return DEFAULT_FLAVOR_ICON;
  return ICON_MAP[key] || DEFAULT_FLAVOR_ICON;
}

/**
 * Paleta de colores predefinidos sugeridos para sabores de cremolada
 */
export const PRESET_FLAVOR_COLORS = [
  { name: 'Rojo Fresa', hex: '#EF4444' },
  { name: 'Fucsia Frambuesa', hex: '#EC4899' },
  { name: 'Rosa Pastel', hex: '#F472B6' },
  { name: 'Naranja Cítrico', hex: '#F97316' },
  { name: 'Amarillo Mango', hex: '#F59E0B' },
  { name: 'Amarillo Piña', hex: '#EAB308' },
  { name: 'Verde Limón', hex: '#84CC16' },
  { name: 'Verde Manzana', hex: '#10B981' },
  { name: 'Menta Fresca', hex: '#06B6D4' },
  { name: 'Azul Cielo', hex: '#3B82F6' },
  { name: 'Púrpura Uva', hex: '#8B5CF6' },
  { name: 'Morado Chicha', hex: '#6B21A8' },
  { name: 'Marrón Lúcuma', hex: '#B45309' },
  { name: 'Blanco Coco', hex: '#E2E8F0' },
];

/**
 * Calcula si un color hexadecimal es claro u oscuro para asegurar contraste legible
 * Devuelve '#000000' para fondos claros o '#FFFFFF' para fondos oscuros
 */
export function getContrastTextColor(hexColor) {
  if (!hexColor || typeof hexColor !== 'string') return '#1E293B';
  const cleanHex = hexColor.replace('#', '');
  if (cleanHex.length !== 6 && cleanHex.length !== 3) return '#1E293B';

  let r, g, b;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }

  // Luminancia relativa estimada
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 155 ? '#0F172A' : '#FFFFFF';
}
