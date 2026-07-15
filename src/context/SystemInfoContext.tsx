import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import apiClient from '../api/apiClient';
import { INSTITUTION } from '../constants/institution';

export interface SystemInfo {
  logoUrl: string;
  commercialName: string;
  legalName: string;
  acronym: string;
}

const DEFAULTS: SystemInfo = {
  logoUrl: '/logo-nuevo.png',
  commercialName: 'UNEFA',
  legalName: INSTITUTION.legalName,
  acronym: 'UNEFA',
};

const SystemInfoContext = createContext<SystemInfo>(DEFAULTS);

export function SystemInfoProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<SystemInfo>(DEFAULTS);

  const fetchInfo = useCallback(async () => {
    try {
      const res = await apiClient.get('/system-institution', { silent: true } as any);
      const d = res.data?.data || res.data;
      if (d && d.legal_name) {
        setInfo({
          logoUrl: d.logo_url || DEFAULTS.logoUrl,
          commercialName: d.commercial_name || DEFAULTS.commercialName,
          legalName: d.legal_name || DEFAULTS.legalName,
          acronym: d.acronym || DEFAULTS.acronym,
        });
      }
    } catch {
      // fallback a defaults, silencioso
    }
  }, []);

  useEffect(() => {
    fetchInfo();
    const handler = () => fetchInfo();
    window.addEventListener('unefa:system-info:updated', handler);
    return () => window.removeEventListener('unefa:system-info:updated', handler);
  }, [fetchInfo]);

  return (
    <SystemInfoContext.Provider value={info}>
      {children}
    </SystemInfoContext.Provider>
  );
}

export const useSystemInfo = () => useContext(SystemInfoContext);