import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/context/toast";
import { TOAST } from "@/components/ui/dialog/DialogConfig";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";

import { UnifiedDialog } from "../../../components/ui/dialog/UnifiedDialog";
import { SYSTEM_DIALOGS } from "../../../components/ui/dialog/DialogConfig";
import { SearchableInput } from "../../../features/reports/components/SearchableInput";
import { RecordListModal } from "../../../features/reports/components/RecordListModal";
import { useProspectLists } from "../hooks/useProspectLists";
import { getPeriods } from "../../../features/periods/services/periodService";
import { ListSelector } from "./ListSelector";
import { ProspectTable } from "./ProspectTable";
import { ImportButton } from "./ImportButton";
import { EligibleStudent } from "../types";
import { unwrapData } from "../../../api/crudServiceFactory";
import { generateSimpleExcel } from "../../../utils/unefaExcelReports";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 10 },
  title: { fontSize: 16, marginBottom: 12, textAlign: "center" },
  subtitle: { fontSize: 10, marginBottom: 16, textAlign: "center", color: "#666" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ccc", paddingVertical: 4, minHeight: 20, alignItems: "center" },
  headerRow: { backgroundColor: "#f0f0f0" },
  cellCi: { width: "20%", paddingHorizontal: 4 },
  cellName: { width: "40%", paddingHorizontal: 4 },
  cellPhone: { width: "25%", paddingHorizontal: 4 },
  cellEnrolled: { width: "15%", paddingHorizontal: 4, textAlign: "center" },
});

interface ProspectListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProspectListModal({ isOpen, onClose }: ProspectListModalProps) {
  const { addToast } = useToast();
  const {
    lists,
    currentList,
    items,
    loading,
    dirty,
    fetchLists,
    selectList,
    createList,
    deleteList,
    addItem,
    removeItem,
    toggleEnrolled,
    searchEligibleStudents,
    markAsSaved,
  } = useProspectLists();

  const [periods, setPeriods] = useState<{ value: string; label: string }[]>([]);
  const [defaultPeriodId, setDefaultPeriodId] = useState("");
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showStudentBrowser, setShowStudentBrowser] = useState(false);

  /** Obtener solo períodos PENDIENTES (status=1), ordenados por startDate, el más próximo primero */
  const getFuturePeriods = useCallback(async () => {
    try {
      const all = await getPeriods();
      const now = new Date();
      const future = all
        .filter(p => {
          const start = typeof p.startDate === 'string' ? new Date(p.startDate) : p.startDate;
          return start > now;
        })
        .sort((a, b) => {
          const aStart = typeof a.startDate === 'string' ? new Date(a.startDate) : a.startDate;
          const bStart = typeof b.startDate === 'string' ? new Date(b.startDate) : b.startDate;
          return aStart.getTime() - bStart.getTime();
        });

      return future;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchLists();
      getFuturePeriods().then(future => {
        const mapped = future.map(p => ({
          value: String(p.periodId),
          label: p.description,
        }));
        setPeriods(mapped);
        // Auto-seleccionar el próximo período pendiente
        if (mapped.length > 0 && periods.length === 0) {
          setDefaultPeriodId(mapped[0].value);
        }
      });
    }
  }, [isOpen, fetchLists, getFuturePeriods]);

  const handleClose = () => {
    if (dirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  const handleCreateList = useCallback(
    async (name: string, periodId: number) => {
      const newList = await createList({ name, periodId });
      if (newList) {
        selectList(newList.listId);
      }
    },
    [createList, selectList]
  );

  const handleDeleteList = useCallback(
    async (id: number) => {
      await deleteList(id);
    },
    [deleteList]
  );

  const handleSelectStudent = useCallback(
    async (student: EligibleStudent) => {
      if (!currentList) return;
      await addItem(currentList.listId, student.studentsId);
    },
    [currentList, addItem]
  );

  const handleImportComplete = useCallback(() => {
    if (currentList) {
      selectList(currentList.listId);
    }
  }, [currentList, selectList]);

  const handleExportExcel = async () => {
    if (!currentList || items.length === 0) {
      addToast({ variant: "error", title: "Sin datos", message: "No hay datos para exportar" });
      return;
    }
    try {
      await generateSimpleExcel(
        items,
        [
          { header: "CI", accessor: (item: any) => item.student?.studentCi || `ID:${item.studentsId}` },
          { header: "Nombre", accessor: (item: any) => item.student ? `${item.student.name} ${item.student.surname}` : "Sin datos" },
          { header: "Teléfono", accessor: (item: any) => item.student?.contactPhone || "—" },
          { header: "Inscripto", accessor: (item: any) => item.enrolled ? "Sí" : "No" },
        ],
        `prospectos_${currentList.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}`,
        `Reporte de Prospectos - ${currentList.name}`
      );
      addToast({ variant: "success", title: "Exportado", message: "Excel exportado exitosamente" });
    } catch (error) {
      addToast({ variant: "error", title: "Error al exportar", message: "Error al exportar Excel" });
      console.error("[ProspectListModal] Error exporting Excel:", error);
    }
  };

  const handleExportPDF = async () => {
    if (!currentList || items.length === 0) {
      addToast({ variant: "error", title: "Sin datos", message: "No hay datos para exportar" });
      return;
    }
    try {
      const blob = await pdf(
        <Document>
          <Page size="A4" style={pdfStyles.page}>
            <Text style={pdfStyles.title}>{currentList.name}</Text>
            {currentList.periodDescription && (
              <Text style={pdfStyles.subtitle}>Período: {currentList.periodDescription}</Text>
            )}
            <View style={{ width: "100%" }}>
              <View style={[pdfStyles.row, pdfStyles.headerRow]}>
                <Text style={{ ...pdfStyles.cellCi, fontFamily: "Times-Roman", fontWeight: "bold" as any }}>CI</Text>
                <Text style={{ ...pdfStyles.cellName, fontFamily: "Times-Roman", fontWeight: "bold" as any }}>Nombre</Text>
                <Text style={{ ...pdfStyles.cellPhone, fontFamily: "Times-Roman", fontWeight: "bold" as any }}>Teléfono</Text>
                <Text style={{ ...pdfStyles.cellEnrolled, fontFamily: "Times-Roman", fontWeight: "bold" as any }}>Inscripto</Text>
              </View>
              {items.map((item, i) => (
                <View style={pdfStyles.row} key={item.itemId || i}>
                  <Text style={pdfStyles.cellCi}>{item.student?.studentCi || `ID:${item.studentsId}`}</Text>
                  <Text style={pdfStyles.cellName}>
                    {item.student ? `${item.student.name} ${item.student.surname}` : "Sin datos"}
                  </Text>
                  <Text style={pdfStyles.cellPhone}>{item.student?.contactPhone || "—"}</Text>
                  <Text style={pdfStyles.cellEnrolled}>{item.enrolled ? "Sí" : "No"}</Text>
                </View>
              ))}
            </View>
          </Page>
        </Document>
      ).toBlob();

      const { saveAs } = await import("file-saver");
      saveAs(blob, `prospectos_${currentList.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
      addToast({ variant: "success", title: "Exportado", message: "PDF exportado exitosamente" });
    } catch (error) {
      addToast({ variant: "error", title: "Error al exportar", message: "Error al exportar PDF" });
      console.error("[ProspectListModal] Error exporting PDF:", error);
    }
  };

  const searchFn = useCallback(
    async (query: string) => {
      return await searchEligibleStudents(query, currentList?.periodId);
    },
    [searchEligibleStudents, currentList?.periodId]
  );

  const selectedListId = currentList?.listId ?? null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="4xl">
        <ModalHeader>Reporte de Prospectos</ModalHeader>
        <ModalBody>
          <div className="space-y-5">
            <ListSelector
              lists={lists}
              selectedListId={selectedListId}
              onSelect={selectList}
              onCreateList={handleCreateList}
              onDeleteList={handleDeleteList}
              periods={periods}
              defaultPeriodId={defaultPeriodId}
              loading={loading}
            />

            {currentList && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1.5">
                    Buscar y agregar estudiantes
                  </label>
                  <SearchableInput<EligibleStudent>
                    placeholder="Buscá por CI o nombre del estudiante..."
                    search={searchFn}
                    renderItem={(student: EligibleStudent) => (
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-text-emphasis">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          CI: {student.identificationPrefix}-{student.identificationNumber}
                          {student.careerName && ` · ${student.careerName}`}
                        </p>
                      </div>
                    )}
                    onSelect={(student: any) => handleSelectStudent(student)}
                    getKey={(student: EligibleStudent) => student.studentsId}
                  />
                  <div className="mt-2">
                    <button
                      onClick={() => setShowStudentBrowser(true)}
                      className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 font-medium transition-colors"
                    >
                      Ver lista completa de estudiantes →
                    </button>
                  </div>
                </div>

                <div>
                  {currentList?.periodDescription && (
                    <p className="text-xs text-text-tertiary mb-2">
                      Período: {currentList.periodDescription}
                    </p>
                  )}
                  {dirty && (
                    <p className="text-xs font-medium text-warning-600 dark:text-warning-400 mb-2">
                      Tenés cambios sin guardar
                    </p>
                  )}
                  <ProspectTable
                    items={items}
                    onToggleEnrolled={(itemId) => toggleEnrolled(currentList.listId, itemId)}
                    onRemoveItem={(itemId) => removeItem(currentList.listId, itemId)}
                    loading={loading}
                  />
                </div>

                {items.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <ImportButton
                      listId={currentList.listId}
                      periodId={currentList.periodId}
                      onImportComplete={handleImportComplete}
                    />
                    <Button variant="outline" size="sm" onClick={handleExportExcel}>
                      Exportar Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPDF}>
                      Exportar PDF
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!currentList && !loading && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-bg-secondary p-4 dark:bg-white/5">
                  <svg className="h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-text-primary dark:text-text-emphasis">
                  Seleccioná o creá una lista para comenzar
                </h3>
                <p className="mt-1 text-xs text-text-secondary dark:text-text-tertiary max-w-xs mx-auto">
                  Usá el selector de arriba para elegir una lista existente o creá una nueva.
                </p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" type="button" onClick={handleClose}>
            Cerrar
          </Button>
          {dirty && (
            <Button variant="primary" onClick={markAsSaved} loadingText="Guardando...">
              Guardar lista
            </Button>
          )}
        </ModalFooter>
      </Modal>

      <RecordListModal
        isOpen={showStudentBrowser}
        onClose={() => setShowStudentBrowser(false)}
        recordType="student"
        periodId={currentList?.periodId}
        onSelect={(student: any) => {
          handleSelectStudent(student);
          setShowStudentBrowser(false);
        }}
      />

      <UnifiedDialog
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={handleConfirmClose}
        variant="warning"
        title={SYSTEM_DIALOGS.closeWithoutSaving.title}
        message={SYSTEM_DIALOGS.closeWithoutSaving.message}
        confirmLabel={SYSTEM_DIALOGS.closeWithoutSaving.confirmLabel}
        cancelLabel={SYSTEM_DIALOGS.closeWithoutSaving.cancelLabel}
      />
    </>
  );
}

export default ProspectListModal;
