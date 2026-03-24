/**
 * @file ModalContext.tsx
 * @description Context para manejar el stack de modales y asegurar que ESC cierre el modal correcto (el más reciente)
 */

import { createContext, useContext, useState, useCallback } from "react";

interface ModalStackContextType {
  registerModal: (id: string) => number;
  unregisterModal: (id: string, stackPosition: number) => void;
  isTopModal: (id: string, stackPosition: number) => boolean;
}

const ModalStackContext = createContext<ModalStackContextType | null>(null);

let modalCounter = 0;
const modalStack: { id: string; position: number }[] = [];

export function ModalStackProvider({ children }: { children: React.ReactNode }) {
  const [, forceUpdate] = useState({});

  const registerModal = useCallback((id: string): number => {
    modalCounter++;
    const position = modalCounter;
    modalStack.push({ id, position });
    modalStack.sort((a, b) => a.position - b.position);
    forceUpdate({});
    return position;
  }, []);

  const unregisterModal = useCallback((id: string, stackPosition: number) => {
    const index = modalStack.findIndex(m => m.id === id && m.position === stackPosition);
    if (index !== -1) {
      modalStack.splice(index, 1);
      forceUpdate({});
    }
  }, []);

  const isTopModal = useCallback((id: string, stackPosition: number): boolean => {
    if (modalStack.length === 0) return true;
    const topModal = modalStack[modalStack.length - 1];
    return topModal.id === id && topModal.position === stackPosition;
  }, []);

  return (
    <ModalStackContext.Provider value={{ registerModal, unregisterModal, isTopModal }}>
      {children}
    </ModalStackContext.Provider>
  );
}

export function useModalStack() {
  const context = useContext(ModalStackContext);
  if (!context) {
    // Retornar funciones no-ops si no hay provider
    return {
      registerModal: () => 1,
      unregisterModal: () => {},
      isTopModal: () => true,
    };
  }
  return context;
}
