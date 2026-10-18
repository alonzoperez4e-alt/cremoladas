import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, User } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

const ROUTE_TITLES = {
  '/': 'Inicio',
  '/venta': 'Venta del día',
  '/preparaciones': 'Preparaciones',
  '/gastos': 'Gastos',
  '/sabores': 'Sabores',
  '/cambiar-contrasena': 'Cambiar contraseña',
};

export function Topbar({ isSidebarOpen, onToggleSidebar }) {
  const { user } = useAuth();
  const location = useLocation();

  const currentTitle = ROUTE_TITLES[location.pathname] || 'Cremoladas';

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Izquierda: Botón Hamburguesa y Título */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-expanded={isSidebarOpen}
            aria-controls="sidebar-navigation"
            aria-label="Abrir menú de navegación"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-pink-500"
          >
            <Menu className="w-6 h-6" />
          </button>

          <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight truncate">
            {currentTitle}
          </h1>
        </div>

        {/* Derecha: Nombre del Usuario */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800 leading-tight">
              {user?.fullName || user?.username || 'Usuario'}
            </span>
            <span className="text-[11px] text-pink-600 font-medium">En línea</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-pink-50 border border-pink-200 text-pink-600 flex items-center justify-center text-sm font-bold shadow-2xs">
            {user?.fullName ? user.fullName[0].toUpperCase() : <User className="w-4 h-4" />}
          </div>
        </div>
      </div>
    </header>
  );
}
