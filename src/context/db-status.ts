import { createContext, useContext } from 'react';

export type DbStatus = 'connected' | 'disconnected' | 'checking';

export interface DbStatusContextType {
  status: DbStatus;
  lastChecked: Date | null;
  checkStatus: () => Promise<void>;
  error: string | null;
}

export const DbStatusContext = createContext<DbStatusContextType | undefined>(undefined);

export const useDbStatus = () => {
  const context = useContext(DbStatusContext);
  if (context === undefined) {
    throw new Error('useDbStatus must be used within a DbStatusProvider');
  }
  return context;
};
