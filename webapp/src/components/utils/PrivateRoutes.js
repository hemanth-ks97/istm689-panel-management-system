import React from "react";
// Router
import { Outlet, Navigate } from "react-router-dom";

const PrivateRoutes = ({ isAllowed, redirectPath = "/login", children }) => {
  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? children : <Outlet />;
};

export default PrivateRoutes;
