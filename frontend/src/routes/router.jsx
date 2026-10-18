import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { Spinner } from '../components/ui/Spinner';

// Carga diferida (lazy) de las páginas
const LoginPage = lazy(() => import('../pages/LoginPage'));
const HomePage = lazy(() => import('../pages/HomePage'));
const SalePage = lazy(() => import('../pages/SalePage'));
const FlavorsPage = lazy(() => import('../features/flavors/pages/FlavorsPage'));
const ExpensesPage = lazy(() => import('../features/expenses/pages/ExpensesPage'));
const PreparationsPage = lazy(() =>
  import('../features/preparations/pages/PreparationsPage')
);
const ChangePasswordPage = lazy(() => import('../pages/ChangePasswordPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const pageFallback = (
  <div className="w-full min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <Spinner size="lg" className="text-pink-600" />
    <span className="text-xs font-medium text-slate-400 animate-pulse">
      Cargando vista...
    </span>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Suspense fallback={pageFallback}><LoginPage /></Suspense>,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Suspense fallback={pageFallback}><HomePage /></Suspense>,
      },
      {
        path: 'venta',
        element: <Suspense fallback={pageFallback}><SalePage /></Suspense>,
      },
      {
        path: 'sabores',
        element: <Suspense fallback={pageFallback}><FlavorsPage /></Suspense>,
      },
      {
        path: 'gastos',
        element: <Suspense fallback={pageFallback}><ExpensesPage /></Suspense>,
      },
      {
        path: 'preparaciones',
        element: <Suspense fallback={pageFallback}><PreparationsPage /></Suspense>,
      },
      {
        path: 'cambiar-contrasena',
        element: <Suspense fallback={pageFallback}><ChangePasswordPage /></Suspense>,
      },
    ],
  },
  {
    path: '*',
    element: <Suspense fallback={pageFallback}><NotFoundPage /></Suspense>,
  },
]);
