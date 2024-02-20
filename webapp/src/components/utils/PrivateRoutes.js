import React from "react";
// Router
import { Navigate } from "react-router-dom";
import AppLayout from "../layout/AppLayout";

const PrivateRoutes = ({ isAllowed, redirectPath = "/login" }) => {
  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }

  return <AppLayout />;
};

export default PrivateRoutes;
