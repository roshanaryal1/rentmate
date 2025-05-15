import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function RoleRoute({ allowedRoles, children }) {
  const { currentUser, userRole, loading } = useAuth();
  if (loading) return null;              // or a spinner
  if (!currentUser) return <Navigate to="/login" />;
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/not-authorized" />;
  }
  return children;
}
