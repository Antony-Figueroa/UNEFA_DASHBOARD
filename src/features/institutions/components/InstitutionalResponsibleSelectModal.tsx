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
import { Search, UserPlus, Building2 } from "lucide-react";
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
    }
  }, [isOpen]);

  const loadResponsibles = async () => {
    setLoading(true);
    try {
      const response = await responsibleService.getAll();
      console.log("[SearchModal] Responsables cargados:", response?.length || 0);
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
    // Si ya está en la institución, no hacer nada
    if (currentInstitutionId && String(resp.institutionId) === String(currentInstitutionId)) {
        return;
    }
    
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
              const isLinked = currentInstitutionId && String(resp.institutionId) === String(currentInstitutionId);
              return (
                <div
                  key={resp.responsibleId}
                  className={cn(
                    "flex items-center justify-between p-4 bg-white dark:bg-gray-800/50 rounded-xl border transition-all group",
                    isLinked 
                      ? "border-gray-200 dark:border-gray-700 opacity-75 grayscale-[0.5]" 
                      : "border-gray-100 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-500/50"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "text-sm font-bold truncate",
                        isLinked ? "text-text-tertiary" : "text-text-main dark:text-white"
                      )}>
                        {resp.firstName} {resp.lastName}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full font-medium">
                        {resp.identificationPrefix}-{resp.identificationNumber}
                      </span>
                      {isLinked && (
                        <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-bold">
                          Vinculado
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <p className="text-xs text-text-secondary flex items-center gap-1">
                         <Building2 className="w-3 h-3" /> {resp.institutionName || "Sin institución"}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {resp.email} • {resp.cargo || "Responsable"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isLinked ? "outline" : "primary"}
                    onClick={() => handleSelect(resp)}
                    loading={selecting === resp.responsibleId}
                    disabled={!!isLinked}
                    className={cn(
                      "ml-4 transition-all",
                      !isLinked && "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {isLinked ? (
                      "Ya vinculado"
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Seleccionar
                      </>
                    )}
                  </Button>
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
