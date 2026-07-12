/**
 * @file useCulminationUI.ts
 * @description Pure UI state management hook for culmination tab.
 * Manages row expansion, tab selection, and modal state. No API calls.
 */

import { useState, useCallback } from 'react';

export interface UseCulminationUIReturn {
  expandedStudentCi: string | null;
  activeTab: 'evaluations' | 'culmination' | 'certification';
  isModalOpen: boolean;
  modalType: string | null;
  selectedPracticeId: number | null;
  toggleRow: (studentCi: string) => void;
  setActiveTab: (tab: 'evaluations' | 'culmination' | 'certification') => void;
  openModal: (type: string, practiceId?: number) => void;
  closeModal: () => void;
}

/**
 * Hook that manages UI state for the culmination tab.
 * Tracks expanded rows, active tab, and modal visibility.
 * Pure state management — no API calls.
 */
export const useCulminationUI = (): UseCulminationUIReturn => {
  const [expandedStudentCi, setExpandedStudentCi] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'evaluations' | 'culmination' | 'certification'>('evaluations');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [selectedPracticeId, setSelectedPracticeId] = useState<number | null>(null);

  const toggleRow = useCallback((studentCi: string) => {
    setExpandedStudentCi(prev => (prev === studentCi ? null : studentCi));
  }, []);

  const openModal = useCallback((type: string, practiceId?: number) => {
    setModalType(type);
    setSelectedPracticeId(practiceId ?? null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalType(null);
    setSelectedPracticeId(null);
  }, []);

  return {
    expandedStudentCi,
    activeTab,
    isModalOpen,
    modalType,
    selectedPracticeId,
    toggleRow,
    setActiveTab,
    openModal,
    closeModal,
  };
};

export default useCulminationUI;
