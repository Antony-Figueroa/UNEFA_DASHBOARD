/**
 * @file usePageTitle.tsx
 * @description Hook global para setear el título de la página actual
 * Usado por el breadcrumb global del header
 */

import { useState, createContext, useContext, useCallback } from 'react';

interface PageTitleContextType {
  setPageTitle: (title: string) => void;
  pageTitle: string;
}

const PageTitleContext = createContext<PageTitleContextType>({
  setPageTitle: () => {},
  pageTitle: ''
});

export const PageTitleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pageTitle, setPageTitleState] = useState('');

  const setPageTitle = useCallback((title: string) => {
    setPageTitleState(title);
  }, []);

  return (
    <PageTitleContext.Provider value={{ pageTitle, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
};

export const usePageTitle = () => {
  const context = useContext(PageTitleContext);
  if (!context) {
    // Return default values if not in provider (for pages that don't use it)
    return { setPageTitle: (_title: string) => {}, pageTitle: '' };
  }
  return context;
};

export default usePageTitle;