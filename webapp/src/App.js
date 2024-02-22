import React from "react";
// React Router
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
// Redux
import { useSelector } from "react-redux";
// Components
import PublicLayout from "./components/layout/PublicLayout";
import PrivateRoutes from "./components/utils/PrivateRoutes";
import HomePage from "./components/pages/HomePage";
import LoginPage from "./components/pages/LoginPage";
import ProfilePage from "./components/pages/ProfilePage";
import QuestionPage from "./components/pages/QuestionPage";
import AdminPage from "./components/pages/AdminPage";
import PrivacyPage from "./components/pages/PrivacyPage";
import TermsPage from "./components/pages/TermsPage";

const App = () => {
  const { user } = useSelector((state) => state.user);

  return (
    <BrowserRouter>
      <Routes>
        {/* Need auth users to visit these pages */}
        {/* Student allowed routes */}
        <Route element={<PrivateRoutes isAllowed={!!user} />}>
          <Route element={<HomePage />} path="/" exact />
          <Route element={<ProfilePage />} path="/profile" />
          <Route element={<QuestionPage />} path="/question" />
        </Route>
        {/* TODO: Admin allowed routes */}
        <Route element={<PrivateRoutes isAllowed={!!user} />}>
          <Route element={<AdminPage />} path="/admin" />
        </Route>

        <Route element={<PublicLayout />}>
          {/* Public pages */}
          <Route element={<LoginPage />} path="/login" />
          {/* Privacy and Terms are required to use Google oAuth2 client */}
          <Route element={<PrivacyPage />} path="/privacy" />
          <Route element={<TermsPage />} path="/terms" />
        </Route>

        {/* Default redirect to home page */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
