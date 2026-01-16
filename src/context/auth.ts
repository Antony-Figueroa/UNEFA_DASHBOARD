import { createContext, useContext } from "react";

export interface AuthUser {
  id: number;
  userCi: string;
  name: string;
  secondName?: string;
  surname: string;
  secondSurname?: string;
  email: string;
  phoneNumber?: string;
  role: number;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
