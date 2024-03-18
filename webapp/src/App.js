import React from "react";
// React Router
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
// Redux
import { useSelector } from "react-redux";
// Components
import PublicLayout from "./components/layout/PublicLayout";
import PrivateRoutes from "./components/utils/PrivateRoutes";
import DashboardPage from "./components/pages/dashboards/DashboardPage";
import LoginPage from "./components/pages/logins/LoginPage";
import ProfilePage from "./components/pages/ProfilePage";
import AdminDashboardPage from "./components/pages/dashboards/AdminDashboardPage";
import PanelPage from "./components/pages/PanelPage";
import AdminUsersPage from "./components/pages/AdminUsersPage";
import QuestionsPage from "./components/pages/QuestionsPage";
import GradesPage from "./components/pages/GradesPage";
import VotingPage from "./components/pages/VotingPage";
import TaggingPage from "./components/pages/TaggingPage";
import AdminImportPage from "./components/pages/AdminImportPage";
import PrivacyPage from "./components/pages/PrivacyPage";
import TermsPage from "./components/pages/TermsPage";
import StudentLoginPage from "./components/pages/logins/StudentLoginPage";
import PanelLoginPage from "./components/pages/logins/PanelLoginPage";
import NotFoundPage from "./components/pages/NotFoundPage";

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
          <Route element={<DashboardPage />} path="/" exact />
          <Route element={<ProfilePage />} path="profile" />
          <Route element={<GradesPage />} path="grades" />
          {/* CHANGE TO PANELS TO FOLLOW NAMING CONVETION */}
          <Route element={<PanelPage />} path="panels" />

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
            {/* <Route element={<AdminPanelsPage />} path="panels" /> */}
            {/* <Route element={<AdminGradesPage />} path="grades" /> */}
            <Route element={<AdminUsersPage />} path="users" />
            <Route element={<AdminImportPage />} path="import" />

            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Route>

        <Route element={<PublicLayout />}>
          {/* Public pages */}
          <Route element={<LoginPage />} path="login">
            <Route index element={<StudentLoginPage />} />
            <Route element={<PanelLoginPage />} path="panel" />
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
