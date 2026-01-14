import React from "react";
// import { Navigate } from "react-router";
// import { useAuth } from "../../context/AuthContext";
// import PageLoader from "../ui/loader";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  // Comentado temporalmente para permitir acceso libre
  /*
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (user) {
    // Redirect to dashboard if already authenticated
    return <Navigate to="/" replace />;
  }
  */

  return <>{children}</>;
};

export default PublicRoute;
