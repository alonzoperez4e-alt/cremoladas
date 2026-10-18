import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-pink-50 text-pink-600 flex items-center justify-center text-3xl mb-4 shadow-xs">
        🍧
      </div>
      <h1 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight">
        404
      </h1>
      <h2 className="text-lg font-bold text-slate-700 mt-2">
        Página no encontrada
      </h2>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
        La ruta a la que intentas acceder no existe o fue movida.
      </p>
      <Link to="/">
        <Button variant="primary" icon={Home}>
          Volver al Inicio
        </Button>
      </Link>
    </div>
  );
}
