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
import AdminDashboardPage from "./components/pages/AdminDashboardPage";
import AdminGradesPage from "./components/pages/AdminGradesPage";
import PanelDashboardPage from "./components/pages/PanelDashboardPage";
import AdminPanelsPage from "./components/pages/AdminPanelsPage";
import AdminUsersPage from "./components/pages/AdminUsersPage";
import QuestionsPage from "./components/pages/QuestionsPage";
import GradesPage from "./components/pages/GradesPage";
import VotingPage from "./components/pages/VotingPage";
import TaggingPage from "./components/pages/TaggingPage";
import PrivacyPage from "./components/pages/PrivacyPage";
import TermsPage from "./components/pages/TermsPage";
import StudentLogin from "./components/pages/StudentLogin";
import PanelLogin from "./components/pages/PanelLogin";
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
          <Route element={<ProfilePage />} path="profile" />
          <Route element={<GradesPage />} path="grades" />
          <Route element={<PanelDashboardPage />} path="panels" />

          <Route element={<PanelPage />} path="panel/:panelId">
            <Route element={<QuestionsPage />} path="questions" />
            <Route element={<QuestionsPage />} path="question" />
            <Route element={<VotingPage />} path="voting" />
            <Route element={<TaggingPage />} path="tagging" />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Route>
        {/* allow only admin to view these pages */}
        <Route element={<PrivateRoutes isAllowed={user?.role === ADMIN} />}>
          <Route element={<AdminDashboardPage />} path="admin">
            <Route element={<AdminPanelsPage />} path="panels" />
            <Route element={<AdminGradesPage />} path="grades" />
            <Route element={<AdminUsersPage />} path="users" />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Route>

        <Route element={<PublicLayout />}>
          {/* Public pages */}
          <Route element={<LoginPage />} path="login">
            <Route index element={<StudentLogin />} />
            <Route element={<PanelLogin />} path="panel" />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
          <Route element={<NotFoundPage />} path="notfound" />
          {/* Privacy and Terms are required to use Google oAuth2 client */}
          <Route element={<PrivacyPage />} path="privacy" />
          <Route element={<TermsPage />} path="terms" />
        </Route>

        {/* Default redirect to home page */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
