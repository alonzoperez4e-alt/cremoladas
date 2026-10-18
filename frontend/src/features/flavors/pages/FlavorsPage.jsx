import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Sparkles } from 'lucide-react';
import { useFlavors, useDeleteFlavor } from '../hooks/useFlavors';
import { FlavorBadge } from '../../../components/ui/FlavorBadge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { FlavorFormModal } from '../components/FlavorFormModal';
import { getErrorMessage } from '../../../lib/errors';

export default function FlavorsPage() {
  const { data: flavors, isLoading, isError, error, refetch } = useFlavors();
  const deleteMutation = useDeleteFlavor();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlavor, setEditingFlavor] = useState(null);
  const [flavorToDelete, setFlavorToDelete] = useState(null);

  const handleOpenCreate = () => {
    setEditingFlavor(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (flavor) => {
    setEditingFlavor(flavor);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!flavorToDelete) return;
    try {
      await deleteMutation.mutateAsync(flavorToDelete.id);
      setFlavorToDelete(null);
    } catch {
      // Notificación ya gestionada por onError
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y acción principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Catálogo de Sabores
          </h2>
          <p className="text-sm text-slate-500">
            Administra los sabores de cremolada disponibles en el negocio.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={handleOpenCreate}
          className="w-full sm:w-auto"
        >
          Nuevo sabor
        </Button>
      </div>

      {/* Estados de carga, error y lista */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Error al cargar los sabores"
          message={getErrorMessage(error)}
          onRetry={refetch}
        />
      ) : !flavors || flavors.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No hay sabores registrados"
          description="Crea tu primer sabor para comenzar a registrar preparaciones y ventas."
          actionLabel="Crear primer sabor"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {flavors.map((flavor) => (
            <div
              key={flavor.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FlavorBadge flavor={flavor} showName={false} size="lg" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 text-base truncate">
                      {flavor.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {flavor.color?.toUpperCase()}
                    </p>
                  </div>
                </div>

                {flavor.isSoldOut && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                    Agotado
                  </span>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-50">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Edit2}
                  onClick={() => handleOpenEdit(flavor)}
                  aria-label={`Editar sabor ${flavor.name}`}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  icon={Trash2}
                  onClick={() => setFlavorToDelete(flavor)}
                  aria-label={`Eliminar sabor ${flavor.name}`}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Crear / Editar Sabor */}
      <FlavorFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFlavor(null);
        }}
        initialData={editingFlavor}
      />

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={Boolean(flavorToDelete)}
        onClose={() => setFlavorToDelete(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        title={`¿Eliminar sabor "${flavorToDelete?.name}"?`}
        description="El sabor dejará de aparecer en la lista para nuevas preparaciones y ventas, pero se conservará el historial existente de operaciones."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
