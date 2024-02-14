import React from "react";
// React Router
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
// Redux
import { useSelector } from "react-redux";
// Pages
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import ProfilePage from "../pages/ProfilePage";
import AdminPage from "../pages/AdminPage";
// Utils
import PrivateRoutes from "../utils/PrivateRoutes";
// Widgets
import TopBar from "../widgets/TopBar";

const AppLayout = () => {
  const { user } = useSelector((state) => state.user);

  return (
    <BrowserRouter>
      <Routes>
        {/* Need auth users to visit these pages */}
        <Route element={<PrivateRoutes isAllowed={!!user} />}>
          <Route element={<HomePage />} path="/" exact />
          <Route element={<ProfilePage />} path="/profile" />
        </Route>
        <Route element={<PrivateRoutes isAllowed={!!user} />}>
          <Route element={<AdminPage />} path="/admin" />
        </Route>

        {/* Public pages */}
        <Route element={<LoginPage />} path="/login" />

        {/* Default redirect to home page */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppLayout;
