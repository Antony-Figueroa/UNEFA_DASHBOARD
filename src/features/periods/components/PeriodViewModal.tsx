/**
 * @file Modal para la visualización de un periodo académico.
 * @description Muestra un calendario de solo lectura con el rango de fechas resaltado.
 */

import { useTheme } from '../../../context/ThemeContext';
import { Periodo } from '../types';
import { Modal } from '../../../components/ui/modal';
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} className={`w-[70vw] max-w-3xl p-6 ${colorMode === 'dark' ? 'dark' : ''}`}>
            <style>{`
                /* Oculta el input de texto que react-flatpickr genera para el modo inline */
                .period-view-calendar .flatpickr-input {
                    display: none;
                }
                /* Deshabilita la interacción con los días, pero permite la navegación de mes/año */
                .flatpickr-calendar .flatpickr-day {
                    pointer-events: none;
                }

                /* Estilos para el tema oscuro del calendario */
                .flatpickr-calendar.dark {
                    background-color: #24303F;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    border: 1px solid #3d4d60;
                }
                .flatpickr-calendar.dark .flatpickr-month {
                    color: #fff;
                    fill: #fff;
                }
                .flatpickr-calendar.dark .flatpickr-current-month .flatpickr-monthDropdown-months .flatpickr-monthDropdown-month {
                    background-color: #24303F;
                    color: #fff;
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
            <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
                <div>
                    <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                        Vista del Periodo
                    </h5>
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                        {periodo.description}
                    </p>
                </div>
                <div className="mt-6 flex justify-center period-view-calendar">
                    <Flatpickr
                        options={{
                            mode: 'range',
                            dateFormat: 'Y-m-d',
                            defaultDate: [periodo.startDate, periodo.endDate],
                            inline: true, // Muestra el calendario directamente
                            onOpen: (_, __, instance) => {
                                if (colorMode === 'dark') instance.calendarContainer.classList.add('dark');
                            },
                        }}
                    />
                </div>
                <div className="flex justify-end gap-4.5 mt-6">
                    <button
                        className="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                        type="button"
                        onClick={onClose}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </Modal>
    );
}