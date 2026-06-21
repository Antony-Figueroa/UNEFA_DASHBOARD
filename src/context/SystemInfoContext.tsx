import { createContext, useContext, type ReactNode } from "react";

interface SystemInfo {
  logoUrl: string;
  commercialName: string;
}

const DEFAULT_INFO: SystemInfo = {
  logoUrl: "/logo-nuevo.png",
  commercialName: "UNEFA",
};

const SystemInfoContext = createContext<SystemInfo>(DEFAULT_INFO);

export function SystemInfoProvider({ children }: { children: ReactNode }) {
  return (
    <SystemInfoContext.Provider value={DEFAULT_INFO}>
      {children}
    </SystemInfoContext.Provider>
  );
}

export function useSystemInfo(): SystemInfo {
  return useContext(SystemInfoContext);
}
