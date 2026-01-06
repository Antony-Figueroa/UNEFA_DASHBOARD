/**
 * @file useInstitutionalResponsibles.tsx
 * @description Hook para la gestión de responsables institucionales.
 */

import { useState, useEffect, useCallback } from "react";
import { InstitutionalResponsible } from "../types";
import { useToast } from "../../../context/toast";
import { ChangeComparison, RecordDetails } from "../../../components/ui/alert/AlertContextualContent";

type Status = "loading" | "success" | "error";

const RESPONSIBLE_LABELS: Record<string, string> = {
  identificationPrefix: "Tipo",
  identificationNumber: "Cédula",
  firstName: "Primer Nombre",
  middleName: "Segundo Nombre",
  lastName: "Primer Apellido",
  secondLastName: "Segundo Apellido",
  phone: "Teléfono",
  email: "Correo",
  institutionName: "Institución",
};

const MOCK_RESPONSIBLES: InstitutionalResponsible[] = [
  {
    responsibleId: "1",
    identificationPrefix: "V-",
    identificationNumber: "12345678",
    firstName: "Juan",
    middleName: "Alberto",
    lastName: "Pérez",
    secondLastName: "García",
    phone: "04121234567",
    email: "juan.perez@ejemplo.com",
    institutionId: "1",
    institutionName: "Universidad de Carabobo",
    status: true,
    registrationDate: new Date(),
  },
  {
    responsibleId: "2",
    identificationPrefix: "V-",
    identificationNumber: "87654321",
    firstName: "María",
    middleName: "Elena",
    lastName: "Rodríguez",
    secondLastName: "López",
    phone: "04147654321",
    email: "maria.rodriguez@ejemplo.com",
    institutionId: "2",
    institutionName: "Hospital Central",
    status: true,
    registrationDate: new Date(),
  }
];

export const useInstitutionalResponsibles = () => {
  const [responsibles, setResponsibles] = useState<InstitutionalResponsible[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [loadingAction, setLoadingAction] = useState(false);
  const { addToast } = useToast();

  const refreshResponsibles = useCallback(async () => {
    setStatus("loading");
    try {
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 500));
      setResponsibles(MOCK_RESPONSIBLES);
      setStatus("success");
    } catch (e) {
      console.error("Error loading responsibles:", e);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refreshResponsibles();
  }, [refreshResponsibles]);

  const addResponsible = async (respData: Omit<InstitutionalResponsible, "responsibleId" | "registrationDate">) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const newResp: InstitutionalResponsible = {
      ...respData,
      responsibleId: Math.random().toString(36).substr(2, 9),
      registrationDate: new Date(),
    };

    setResponsibles(prev => [newResp, ...prev]);
    setLoadingAction(false);

    addToast({
      variant: "success",
      title: "Responsable Registrado",
      message: (
        <>
          <p>El responsable <strong>{newResp.firstName} {newResp.lastName}</strong> ha sido registrado correctamente.</p>
          <RecordDetails
            data={newResp as unknown as Record<string, unknown>}
            labels={RESPONSIBLE_LABELS}
            fields={['identificationNumber', 'phone', 'email', 'institutionName']}
          />
        </>
      ),
    });
  };

  const editResponsible = async (respData: InstitutionalResponsible) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const oldResp = responsibles.find(r => r.responsibleId === respData.responsibleId);
    setResponsibles(prev => prev.map(r => r.responsibleId === respData.responsibleId ? respData : r));
    setLoadingAction(false);

    addToast({
      variant: "success",
      title: "Responsable Actualizado",
      message: (
        <>
          <p>Los datos de <strong>{respData.firstName} {respData.lastName}</strong> han sido actualizados.</p>
          {oldResp && <ChangeComparison 
            oldData={oldResp as unknown as Record<string, unknown>} 
            newData={respData as unknown as Record<string, unknown>} 
            labels={RESPONSIBLE_LABELS} 
          />}
        </>
      ),
    });
  };

  const toggleStatus = async (resp: InstitutionalResponsible) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const newStatus = !resp.status;
    setResponsibles(prev => prev.map(r => r.responsibleId === resp.responsibleId ? { ...r, status: newStatus } : r));
    setLoadingAction(false);

    addToast({
      variant: newStatus ? "success" : "warning",
      title: newStatus ? "Responsable Restaurado" : "Responsable Inactivado",
      message: `El responsable ${resp.firstName} ${resp.lastName} ahora está ${newStatus ? 'activo' : 'inactivo'}.`,
    });
  };

  const bulkRemoveResponsibles = async (ids: string[]) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setResponsibles(prev => prev.map(r => ids.includes(r.responsibleId) ? { ...r, status: false } : r));
    setLoadingAction(false);
    addToast({
      variant: "warning",
      title: "Acción Masiva",
      message: `${ids.length} responsables han sido inactivados.`,
    });
  };

  const bulkRestoreResponsibles = async (ids: string[]) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setResponsibles(prev => prev.map(r => ids.includes(r.responsibleId) ? { ...r, status: true } : r));
    setLoadingAction(false);
    addToast({
      variant: "success",
      title: "Acción Masiva",
      message: `${ids.length} responsables han sido restaurados.`,
    });
  };

  return {
    responsibles,
    status,
    loadingAction,
    addResponsible,
    editResponsible,
    toggleStatus,
    bulkRemoveResponsibles,
    bulkRestoreResponsibles,
  };
};
