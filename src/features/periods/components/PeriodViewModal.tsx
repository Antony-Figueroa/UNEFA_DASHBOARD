/**
 * @file Modal para la visualización de un período académico.
 * @description Muestra un calendario dual de solo lectura con el rango de fechas resaltado y estadísticas de duración.
 */

import { Periodo } from '../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import DualCalendar from './DualCalendar';
import DisplayText from '../../../components/common/DisplayText';

interface PeriodViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    periodo: Periodo | null;
}

export default function PeriodViewModal({ isOpen, onClose, periodo }: PeriodViewModalProps) {
    if (!periodo) return null;

    const startDate = new Date(periodo.startDate);
    const endDate = new Date(periodo.endDate);

    return (
                <Modal isOpen={isOpen} onClose={onClose} size="5xl" showCloseButton>
                    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-bg-dark rounded-3xl">
                <ModalHeader className="shrink-0 pt-6 px-6 sm:pt-10 sm:px-12 bg-white dark:bg-bg-dark border-b border-border-light dark:border-border-dark">
                    <div className="max-w-5xl mx-auto w-full">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-500/10 text-brand-500">
                                {periodo.code || 'SIN CÓDIGO'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-500/10 text-brand-500">
                                Vista Detallada
                            </span>
                        </div>
                        <h5 className="mb-1 font-bold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                            <DisplayText>{periodo.description}</DisplayText>
                        </h5>
                        <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
                            Cronograma académico y distribución de semanas para el lapso seleccionado.
                        </p>
                    </div>
                </ModalHeader>

                <ModalBody className="overflow-y-auto custom-scrollbar grow px-6 sm:px-12 py-6 sm:py-10 bg-bg-secondary/30 dark:bg-bg-dark/50">
                    <div className="max-w-5xl mx-auto w-full">
                        <DualCalendar startDate={startDate} endDate={endDate} />
                    </div>
                </ModalBody>

                <ModalFooter className="shrink-0 px-6 sm:px-12 py-6 bg-white dark:bg-bg-dark border-t border-border-light dark:border-border-dark">
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-5xl mx-auto">
                        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto min-h-12 px-8">
                            Cerrar
                        </Button>
                    </div>
                </ModalFooter>
            </div>
        </Modal>
    );
}
