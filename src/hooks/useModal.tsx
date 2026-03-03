import { useState, useCallback } from "react";

/**
 * Hook personalizado para gestionar el estado de un modal.
 * Proporciona funciones para abrir, cerrar y alternar la visibilidad de un modal.
 *
 * @param initialState - Estado inicial del modal (default: false)
 * @returns Objeto con estado y funciones de control
 *
 * @example
 * ```tsx
 * const { isOpen, openModal, closeModal, toggleModal } = useModal();
 *
 * return (
 *   <>
 *     <button onClick={openModal}>Abrir</button>
 *     {isOpen && <Modal onClose={closeModal}>Contenido</Modal>}
 *   </>
 * );
 * ```
 */
export const useModal = (initialState: boolean = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  /**
   * Abre el modal.
   * @returns void
   */
  const openModal = useCallback(() => setIsOpen(true), []);

  /**
   * Cierra el modal.
   * @returns void
   */
  const closeModal = useCallback(() => setIsOpen(false), []);

  /**
   * Alterna el estado actual del modal.
   * @returns void
   */
  const toggleModal = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, openModal, closeModal, toggleModal };
};
