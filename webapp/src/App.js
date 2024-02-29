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
import AdminPage from "./components/pages/AdminPage";
import QuestionsPage from "./components/pages/QuestionsPage";
import GradesPage from "./components/pages/GradesPage";
import VotingPage from "./components/pages/VotingPage";
import PrivacyPage from "./components/pages/PrivacyPage";
import TermsPage from "./components/pages/TermsPage";
import NotFoundPage from "./components/pages/NotFoundPage";
import PanelPage from "./components/pages/PanelPage";
//constants
import { ADMIN } from "./config/constants";


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
          <Route element={<QuestionsPage />} path="/questions" />
          <Route element={<GradesPage />} path="/grades" />
          <Route element={<VotingPage />} path="/voting" />
          <Route element={<QuestionsPage />} path="/path-for-module-1-questions" />
        </Route>
        {/* allow only admin to view these pages */}
        <Route element={<PrivateRoutes isAllowed={user?.role == ADMIN} />}>
          <Route element={<AdminPage />} path="/admin" />
          <Route element={<PanelPage />} path="/panel" />
        </Route>

        <Route element={<PublicLayout />}>
          {/* Public pages */}
          <Route element={<LoginPage />} path="/login" />
          <Route element={<NotFoundPage />} path="/notfound" />
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
