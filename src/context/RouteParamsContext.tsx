import { createContext, useContext, ReactNode } from "react";

const RouteParamsContext = createContext<Record<string, string>>({});

export function RouteParamsProvider({
  params,
  children,
}: {
  params: Record<string, string>;
  children: ReactNode;
}) {
  return (
    <RouteParamsContext.Provider value={params}>
      {children}
    </RouteParamsContext.Provider>
  );
}

/** Like useParams() but works with the tab system (KeepAliveOutlet bypasses React Router). */
export function useRouteParams() {
  return useContext(RouteParamsContext);
}
