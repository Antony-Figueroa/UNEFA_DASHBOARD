/**
 * @file InstitutionalResponsibleViewModal.tsx
 * @description Modal para visualizar los detalles de un responsable institucional.
 */

import React from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import { InstitutionalResponsibleRowData } from "../types";
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BuildingOfficeIcon, 
  IdentificationIcon 
} from "../../../icons/actions";

interface InstitutionalResponsibleViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  responsible: InstitutionalResponsibleRowData | null;
}

export default function InstitutionalResponsibleViewModal({
  isOpen,
  onClose,
  responsible,
}: InstitutionalResponsibleViewModalProps) {
  if (!responsible) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton className="max-w-2xl">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-50 dark:bg-brand-500/10 rounded-lg">
            <UserIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Detalles del Responsable
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Información detallada del contacto institucional
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
          {/* Información Personal */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/5 pb-2">
              Información Personal
            </h4>
            
            <div className="flex items-start gap-3">
              <IdentificationIcon className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Identificación</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {responsible.identificationPrefix}{responsible.identificationNumber}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <UserIcon className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Nombres Completos</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {responsible.firstName} {responsible.middleName}
                </p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {responsible.lastName} {responsible.secondLastName}
                </p>
              </div>
            </div>
          </div>

          {/* Información de Contacto e Institución */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/5 pb-2">
              Contacto e Institución
            </h4>

            <div className="flex items-start gap-3">
              <EnvelopeIcon className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Correo Electrónico</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90 break-all">
                  {responsible.email}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <PhoneIcon className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Teléfono</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {responsible.phone}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <BuildingOfficeIcon className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Institución</p>
                <div className="mt-1">
                  <Badge color="primary" variant="light" size="sm">
                    {responsible.institutionName}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div className="col-span-1 md:col-span-2 mt-2">
            <div className={`p-3 rounded-xl border ${responsible.status ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/10' : 'bg-red-50 border-red-100 dark:bg-red-500/5 dark:border-red-500/10'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${responsible.status ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <p className={`text-xs font-bold ${responsible.status ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                  Responsable {responsible.status ? 'Activo' : 'Inactivo'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose} className="min-w-24">
          Cerrar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
