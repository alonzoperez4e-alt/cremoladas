import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  ShoppingBag,
  FlaskConical,
  Receipt,
  Sparkles,
  KeyRound,
  LogOut,
  X,
  User,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { APP_NAME } from '../../lib/config';

export function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Cierra el sidebar al navegar a otra ruta
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname, isOpen, onClose]);

  // Manejo de tecla Escape y bloqueo de scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('overflow-hidden');

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen, onClose]);

  const navItems = [
    { label: 'Inicio', path: '/', icon: Home },
    { label: 'Venta del día', path: '/venta', icon: ShoppingBag },
    { label: 'Preparaciones', path: '/preparaciones', icon: FlaskConical },
    { label: 'Gastos', path: '/gastos', icon: Receipt },
    { label: 'Sabores', path: '/sabores', icon: Sparkles },
    { label: 'Cambiar contraseña', path: '/cambiar-contrasena', icon: KeyRound },
  ];

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onClose();
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Backdrop oscuro */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer deslizante */}
      <aside
        id="sidebar-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Menú principal de navegación"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera del Sidebar */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shadow-inner">
              🍧
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">{APP_NAME}</h2>
              <p className="text-xs text-pink-100 font-medium">Sistema de Ventas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Perfil del Usuario */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm shrink-0">
            {user?.fullName ? user.fullName[0].toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {user?.fullName || user?.username || 'Usuario'}
            </p>
            <p className="text-xs text-slate-400 truncate">@{user?.username || 'admin'}</p>
          </div>
        </div>

        {/* Lista de navegación */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all select-none min-h-[44px] ${
                    isActive
                      ? 'bg-pink-50 text-pink-600 shadow-2xs font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Botón de cerrar sesión al pie */}
        <div className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors cursor-pointer min-h-[44px]"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Diálogo de confirmación para cerrar sesión */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="¿Cerrar sesión?"
        description="Se cerrará tu sesión actual y tendrás que ingresar tus credenciales de nuevo."
        confirmText="Sí, cerrar sesión"
        cancelText="Permanecer aquí"
        variant="danger"
      />
    </>
  );
}
