/**
 * @file Modal para la creación y edición de periodos académicos.
 * @description Este componente presenta un formulario dentro de un modal, utilizando
 * `react-flatpickr` para una selección de fechas estilizada y consistente.
 */

import { useEffect, useState, useMemo } from 'react';
import { Periodo } from '../types';
import { Modal } from '../../../components/ui/modal';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { CalendarIcon } from '../../../icons/actions';

interface PeriodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (periodo: Omit<Periodo, 'id'> | Periodo) => void;
    periodo: Periodo | null;
}

export default function PeriodModal({ isOpen, onClose, onSave, periodo }: PeriodModalProps) {
    const [lapso, setLapso] = useState('');
    // El estado de las fechas se maneja como un array de Date, que es lo que espera Flatpickr.
    const [fechaInicio, setFechaInicio] = useState<Date[]>([]);
    const [fechaFin, setFechaFin] = useState<Date[]>([]);

    /**
     * Genera las opciones para el selector de lapso académico.
     * Se memoiza con `useMemo` para evitar que se recalcule en cada render.
     */
    const lapsoOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const options: string[] = [];
        for (let i = 0; i <= 5; i++) {
            options.push(`${currentYear + i}-I`);
            options.push(`${currentYear + i}-II`);
        }
        return options;
    }, []);

    /**
     * Efecto para inicializar o resetear el formulario cuando el modal se abre.
     */
    useEffect(() => {
        if (isOpen) {
            if (periodo) {
                setLapso(periodo.lapso);
                const inicio = periodo.fechaInicio instanceof Date ? periodo.fechaInicio : new Date(periodo.fechaInicio);
                const fin = periodo.fechaFin instanceof Date ? periodo.fechaFin : new Date(periodo.fechaFin);
                setFechaInicio(!isNaN(inicio.getTime()) ? [inicio] : []);
                setFechaFin(!isNaN(fin.getTime()) ? [fin] : []);
            } else {
                // Reset form for creation
                setLapso('');
                setFechaInicio([]);
                setFechaFin([]);
            }
        }
    }, [periodo, isOpen]);

    /**
     * Maneja el envío del formulario, valida las fechas y llama a la función onSave.
     */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fechaInicio[0] || !fechaFin[0]) {
            // Idealmente, esto debería usar el sistema de alertas de la aplicación.
            alert("Por favor, seleccione las fechas de inicio y fin.");
            return;
        }

        const periodoData = {
            lapso,
            fechaInicio: fechaInicio[0],
            fechaFin: fechaFin[0],
            // El status se asigna por defecto o se mantiene el existente.
            status: periodo?.status || 'Pendiente',
        };

        if (periodo && 'id' in periodo) {
            onSave({ ...periodoData, id: periodo.id });
        } else {
            onSave(periodoData);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-6">
            <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
                <div>
                    <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                        {periodo ? 'Editar Periodo' : 'Crear Nuevo Periodo'}
                    </h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Ingresa los detalles del periodo académico.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="mt-8">
                    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="p-6.5 space-y-4.5">
                            <div>
                                <label className="mb-2.5 block text-black dark:text-white">Lapso Académico</label>
                                <div className="relative z-20 bg-transparent dark:bg-form-input">
                                    <select
                                        value={lapso}
                                        onChange={(e) => setLapso(e.target.value)}
                                        required
                                        className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    >
                                        <option value="" disabled>Selecciona un lapso</option>
                                        {lapsoOptions.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                    <span className="absolute top-1/2 right-4 z-30 -translate-y-1/2">
                                        <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.8"><path fillRule="evenodd" clipRule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z" fill=""></path></g></svg>
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2.5 block text-black dark:text-white">Fecha de Inicio</label>
                                <div className="relative">
                                    <Flatpickr
                                        value={fechaInicio}
                                        onChange={(dates) => setFechaInicio(dates)}
                                        options={{ dateFormat: 'Y-m-d' }}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                        placeholder="Selecciona una fecha"
                                        required
                                    />
                                    <span className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none">
                                        <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2.5 block text-black dark:text-white">Fecha de Fin</label>
                                <div className="relative">
                                    <Flatpickr
                                        value={fechaFin}
                                        onChange={(dates) => setFechaFin(dates)}
                                        options={{ dateFormat: 'Y-m-d', minDate: fechaInicio[0] }}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                        placeholder="Selecciona una fecha"
                                        required
                                    />
                                    <span className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none">
                                        <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4.5 mt-6">
                        <button
                            className="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                            type="button"
                            onClick={onClose}
                        >
                            Cancelar
                        </button>
                        <button
                            className="flex justify-center rounded-lg bg-brand-500 px-6 py-2.5 font-medium text-white hover:bg-brand-600"
                            type="submit"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}