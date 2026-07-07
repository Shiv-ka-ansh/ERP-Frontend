import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { currentUser, checkPathAllowed } = useAppContext();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const defaultRoleCheck = allowedRoles ? allowedRoles.includes(currentUser.role) : true;

  if (checkPathAllowed) {
    const isAllowed = checkPathAllowed(location.pathname, defaultRoleCheck);
    if (!isAllowed) {
      if (location.pathname === '/dashboard') return null; // Safety against infinite loop
      return <Navigate to="/dashboard" replace />;
    }
  } else if (!defaultRoleCheck) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
