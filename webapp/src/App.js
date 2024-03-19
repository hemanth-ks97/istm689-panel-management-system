import React from "react";
// React Router
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
  Outlet,
} from "react-router-dom";
// Redux
import { useSelector } from "react-redux";
// Components

// Layouts
import PublicLayout from "./components/layout/PublicLayout";
import PrivateRoutes from "./components/utils/PrivateRoutes";

// Dashboard
import DashboardPage from "./components/pages/dashboards/DashboardPage";

// Login
import LoginPage from "./components/pages/logins/LoginPage";
import StudentLoginPage from "./components/pages/logins/StudentLoginPage";
import PanelLoginPage from "./components/pages/logins/PanelLoginPage";

// Admin
import AdminGradesPage from "./components/pages/admin/AdminGradesPage";
import AdminUsersPage from "./components/pages/admin/AdminUsersPage";
import AdminImportPage from "./components/pages/admin/AdminImportPage";
import AdminPanelsPage from "./components/pages/admin/AdminPanelsPage";

// Student

// Pages
import ProfilePage from "./components/pages/ProfilePage";
import PanelPage from "./components/pages/PanelPage";
import QuestionsPage from "./components/pages/QuestionsPage";
import GradesPage from "./components/pages/GradesPage";
import VotingPage from "./components/pages/VotingPage";
import TaggingPage from "./components/pages/TaggingPage";
import PrivacyPage from "./components/pages/PrivacyPage";
import TermsPage from "./components/pages/TermsPage";
import NotFoundPage from "./components/pages/NotFoundPage";

// Constants
import { ADMIN, PANELIST, STUDENT } from "./config/constants";

const App = () => {
  const { user } = useSelector((state) => state.user);

  return (
    <BrowserRouter>
      <Routes>
        {/* Authenticated users only */}
        {/* Pages available to ALL users */}
        <Route element={<PrivateRoutes isAllowed={!!user} />}>
          <Route element={<DashboardPage />} path="/" exact />
          <Route element={<ProfilePage />} path="profile" />
        </Route>
        {/* Pages available only to STUDENTS */}
        <Route element={<PrivateRoutes isAllowed={user?.role === STUDENT} />}>
          <Route element={<GradesPage />} path="grades" />
          <Route element={<PanelPage />} path="panels" />
          <Route element={<PanelPage />} path="panel/:panelId">
            <Route element={<QuestionsPage />} path="questions" />
            <Route element={<QuestionsPage />} path="question" />
            <Route element={<VotingPage />} path="voting" />
            <Route element={<TaggingPage />} path="tagging" />
          </Route>
        </Route>
        {/* Pages available only to ADMIN */}
        <Route element={<PrivateRoutes isAllowed={user?.role === ADMIN} />}>
          <Route element={<Outlet />} path="admin">
            <Route element={<AdminPanelsPage />} path="panels" />
            <Route element={<AdminGradesPage />} path="grades" />
            <Route element={<AdminUsersPage />} path="users" />
            <Route element={<AdminImportPage />} path="import" />

            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Route>

        {/* Pages available only to PANELIST */}
        <Route element={<PrivateRoutes isAllowed={user?.role === PANELIST} />}>
          <Route element={<Outlet />} path="panelist">
            <Route element={<AdminPanelsPage />} path="panels" />
            <Route element={<AdminPanelsPage />} path="panel/:panelId" />

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
