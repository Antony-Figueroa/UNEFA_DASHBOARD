/**
 * @file InstitutionalResponsibleSelectModal.tsx
 * @description Modal para buscar y seleccionar responsables existentes en el sistema.
 */

import { useState, useEffect } from "react";
import { Modal, ModalBody, ModalHeader, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import { responsibleService } from "../services/institutionalResponsiblesService";
import { InstitutionalResponsible } from "../types";
import { Search, UserPlus, Building2, Lock } from "lucide-react";
import { useToast } from "../../../context/toast";
import { cn } from "../../../utils/cn";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (responsible: InstitutionalResponsible) => Promise<void>;
  currentInstitutionId?: string;
}

export default function InstitutionalResponsibleSelectModal({ isOpen, onClose, onSelect, currentInstitutionId }: Props) {
  const [search, setSearch] = useState("");
  const [allResponsibles, setAllResponsibles] = useState<InstitutionalResponsible[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadResponsibles();
      setSearch("");
    }
  }, [isOpen]);

  const loadResponsibles = async () => {
    setLoading(true);
    try {
      const response = await responsibleService.getAll();
      setAllResponsibles(response || []);
    } catch (error) {
      console.error("Error loading responsibles:", error);
      addToast({
        variant: "error",
        title: "Error",
        message: "No se pudieron cargar los responsables"
      });
    } finally {
      setLoading(false);
    }
  };

  const filtered = allResponsibles.filter(r => {
    const term = search.toLowerCase();
    const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
    const ci = `${r.identificationPrefix}-${r.identificationNumber}`.toLowerCase();
    return fullName.includes(term) || ci.includes(term) || (r.email || "").toLowerCase().includes(term);
  });

  const handleSelect = async (resp: InstitutionalResponsible) => {
    // Bloquear si ya está en esta institución o en otra
    if (resp.institutionId) return;

    setSelecting(resp.responsibleId);
    try {
      await onSelect(resp);
      onClose();
    } finally {
      setSelecting(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalHeader>Seleccionar Responsable Existente</ModalHeader>
      <ModalBody>
        <div className="mb-6">
          <p className="text-sm text-text-secondary mb-4">
            Busque un responsable registrado en otras instituciones para vincularlo a esta.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, cédula o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto pr-1 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-text-secondary">Cargando responsables...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((resp) => {
              // Ya está vinculado a esta misma institución
              const isLinkedHere =
                currentInstitutionId &&
                resp.institutionId &&
                String(resp.institutionId) === String(currentInstitutionId);

              // Ya está vinculado a OTRA institución
              const isLinkedElsewhere =
                resp.institutionId &&
                (!currentInstitutionId || String(resp.institutionId) !== String(currentInstitutionId));

              const isBlocked = !!isLinkedHere || !!isLinkedElsewhere;

              return (
                <div
                  key={resp.responsibleId}
                  className={cn(
                    "flex items-center justify-between p-4 bg-white dark:bg-gray-800/50 rounded-xl border transition-all group",
                    isBlocked
                      ? "border-gray-200 dark:border-gray-700 opacity-70"
                      : "border-gray-100 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-500/50"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn(
                        "text-sm font-bold truncate",
                        isBlocked ? "text-text-tertiary" : "text-text-main dark:text-white"
                      )}>
                        {resp.firstName} {resp.lastName}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full font-medium">
                        {resp.identificationPrefix}-{resp.identificationNumber}
                      </span>

                      {/* Badge: ya vinculado a esta misma empresa */}
                      {isLinkedHere && (
                        <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-bold">
                          Ya vinculado aquí
                        </span>
                      )}

                      {/* Badge: vinculado a otra empresa */}
                      {isLinkedElsewhere && !isLinkedHere && (
                        <span className="text-[10px] px-2 py-0.5 bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400 rounded-full font-bold flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Vinculado
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 mt-1">
                      <p className="text-xs text-text-secondary flex items-center gap-1">
                        <Building2 className="w-3 h-3 shrink-0" />
                        {resp.institutionName || "Sin institución"}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {resp.email}{resp.cargo && ` • ${resp.cargo}`}
                      </p>
                    </div>
                  </div>

                  {/* Botón con tooltip si está bloqueado */}
                  <div className="ml-4 relative group/btn shrink-0">
                    <Button
                      size="sm"
                      variant={isBlocked ? "outline" : "primary"}
                      onClick={() => handleSelect(resp)}
                      loading={selecting === resp.responsibleId}
                      disabled={isBlocked}
                      className={cn(
                        "transition-all",
                        !isBlocked && "opacity-0 group-hover:opacity-100"
                      )}
                    >
                      {isLinkedHere ? (
                        "Ya vinculado aquí"
                      ) : isLinkedElsewhere ? (
                        <>
                          <Lock className="w-3.5 h-3.5 mr-1.5" />
                          No disponible
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Seleccionar
                        </>
                      )}
                    </Button>

                    {/* Tooltip informativo cuando está vinculado a otra empresa */}
                    {isLinkedElsewhere && !isLinkedHere && (
                      <div className="absolute bottom-full right-0 mb-2 z-50 pointer-events-none">
                        <div className="opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap max-w-[220px] text-wrap text-right">
                          Ya está vinculado a:
                          <br />
                          <span className="font-bold text-yellow-300">
                            {resp.institutionName || "otra institución"}
                          </span>
                        </div>
                        <div className="opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 flex justify-end">
                          <div className="border-4 border-transparent border-t-gray-900" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/10 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
              <p className="text-sm text-text-tertiary">No se encontraron responsables que coincidan con la búsqueda</p>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
      </ModalFooter>
    </Modal>
  );
}
