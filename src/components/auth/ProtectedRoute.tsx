import React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import PageLoader from "../ui/loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
