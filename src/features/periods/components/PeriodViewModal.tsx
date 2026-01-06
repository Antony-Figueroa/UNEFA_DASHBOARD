/**
 * @file Modal para la visualización de un periodo académico.
 * @description Muestra un calendario de solo lectura con el rango de fechas resaltado.
 */

import { useTheme } from '../../../context/theme';
import { Periodo } from '../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

interface PeriodViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    periodo: Periodo | null;
}

export default function PeriodViewModal({ isOpen, onClose, periodo }: PeriodViewModalProps) {
    const { colorMode } = useTheme();

    if (!periodo) return null;

    // Calcular la cantidad de meses entre la fecha de inicio y fin
    const startDate = new Date(periodo.startDate);
    const endDate = new Date(periodo.endDate);
    const monthsCount = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;

    return (
        <Modal isOpen={isOpen} onClose={onClose} showCloseButton className="max-w-5xl">
            <style>{`
                .period-view-calendar .flatpickr-calendar {
                    box-shadow: none !important;
                    border: none !important;
                    transform: scale(0.9);
                    transform-origin: top left;
                    width: auto !important;
                }
                .period-view-calendar .flatpickr-months {
                    display: flex;
                }
                .period-view-calendar .flatpickr-innerContainer {
                    display: flex;
                }
                .period-view-calendar .flatpickr-days {
                    width: 280px !important;
                }
                .flatpickr-calendar.dark {
                    background: transparent;
                    color: #fff;
                }
                /* Ajustes para scroll horizontal de múltiples meses */
                .calendar-scroll-container {
                    overflow-x: auto;
                    overflow-y: hidden;
                    white-space: nowrap;
                    padding-bottom: 15px;
                    width: 100%;
                }
                .calendar-scroll-container::-webkit-scrollbar {
                    height: 6px;
                }
                .calendar-scroll-container::-webkit-scrollbar-track {
                    background: transparent;
                }
                .calendar-scroll-container::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .dark .calendar-scroll-container::-webkit-scrollbar-thumb {
                    background: #334155;
                }
                .flatpickr-calendar.inline {
                    display: flex !important;
                    flex-direction: row !important;
                }
                .flatpickr-months .flatpickr-month {
                    flex: 0 0 280px !important;
                }
                .flatpickr-innerContainer {
                    width: auto !important;
                }
                .flatpickr-calendar.dark .flatpickr-months .flatpickr-month {
                    background: transparent;
                    color: #fff;
                    fill: #fff;
                }
                .flatpickr-calendar.dark .flatpickr-weekdays {
                    background: transparent;
                }
                .flatpickr-calendar.dark span.flatpickr-weekday {
                    color: #fff;
                }
                .flatpickr-calendar.dark .flatpickr-day {
                    color: #fff;
                }
                .flatpickr-calendar.dark .flatpickr-day:hover, 
                .flatpickr-calendar.dark .flatpickr-day.prevMonthDay:hover, 
                .flatpickr-calendar.dark .flatpickr-day.nextMonthDay:hover, 
                .flatpickr-calendar.dark .flatpickr-day:focus {
                    background-color: #3d4d60;
                    border-color: #3d4d60;
                }
                .flatpickr-calendar.dark .flatpickr-day.selected, 
                .flatpickr-calendar.dark .flatpickr-day.startRange, 
                .flatpickr-calendar.dark .flatpickr-day.endRange, 
                .flatpickr-calendar.dark .flatpickr-day.selected.inRange, 
                .flatpickr-calendar.dark .flatpickr-day.startRange.inRange, 
                .flatpickr-calendar.dark .flatpickr-day.endRange.inRange, 
                .flatpickr-calendar.dark .flatpickr-day.selected:focus, 
                .flatpickr-calendar.dark .flatpickr-day.startRange:focus, 
                .flatpickr-calendar.dark .flatpickr-day.endRange:focus, 
                .flatpickr-calendar.dark .flatpickr-day.selected:hover, 
                .flatpickr-calendar.dark .flatpickr-day.startRange:hover, 
                .flatpickr-calendar.dark .flatpickr-day.endRange:hover {
                    background-color: #3C50E0;
                    border-color: #3C50E0;
                    color: #fff;
                }
            `}</style>
            <div className="flex flex-col h-full bg-white dark:bg-gray-900">
                <ModalHeader className="shrink-0 pt-6 px-6 sm:pt-10 sm:px-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <div className="max-w-5xl mx-auto w-full">
                        <h5 className="mb-1 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                            Vista del Periodo
                        </h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                            Detalles del periodo académico {periodo.description}.
                        </p>
                    </div>
                </ModalHeader>

                <ModalBody className="overflow-y-auto custom-scrollbar grow px-6 sm:px-12 py-6 sm:py-10 bg-gray-50/30 dark:bg-gray-900/50">
                    <div className="max-w-5xl mx-auto flex flex-col items-center w-full">
                        <div className="w-full calendar-scroll-container period-view-calendar">
                            <Flatpickr
                                options={{
                                    mode: 'range',
                                    dateFormat: 'Y-m-d',
                                    defaultDate: [periodo.startDate, periodo.endDate],
                                    inline: true,
                                    showMonths: monthsCount,
                                    onOpen: (_, __, instance) => {
                                        if (colorMode === 'dark') instance.calendarContainer.classList.add('dark');
                                    },
                                }}
                            />
                        </div>
                    </div>
                </ModalBody>

                <ModalFooter className="shrink-0 px-6 sm:px-12 py-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-5xl mx-auto">
                        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto min-h-12">
                            Cerrar
                        </Button>
                    </div>
                </ModalFooter>
            </div>
        </Modal>
    );
}
