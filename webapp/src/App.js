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

// Layouts
import PublicLayout from "./components/layout/PublicLayout";
import PrivateRoutes from "./components/utils/PrivateRoutes";

// Dashboard Pages
import DashboardPage from "./components/pages/dashboards/DashboardPage";
import AdminDashboardPage from "./components/pages/dashboards/AdminDashboardPage";

// Login Pages
import LoginPage from "./components/pages/logins/LoginPage";
import StudentLoginPage from "./components/pages/logins/StudentLoginPage";
import PanelLoginPage from "./components/pages/logins/PanelLoginPage";

// Admin Pages
import AdminGradesPage from "./components/pages/admin/AdminGradesPage";
import AdminUsersPage from "./components/pages/admin/AdminUsersPage";
import AdminImportPage from "./components/pages/admin/AdminImportPage";
import AdminPanelsPage from "./components/pages/admin/AdminPanelsPage";

// Panelist Pages
import PanelistPanelsPage from "./components/pages/panelist/PanelistPanelsPage";

// Student Pages
import QuestionsPage from "./components/pages/student/QuestionsPage";
import GradesPage from "./components/pages/student/GradesPage";
import PanelPage from "./components/pages/student/PanelPage";
import VotingPage from "./components/pages/student/VotingPage";
import TaggingPage from "./components/pages/student/TaggingPage";

// Common Pages
import ProfilePage from "./components/pages/ProfilePage";
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
          <Route element={<PanelPage />} path="panel/:panelId" />
          {/* Not ideal, but it works for the demo */}
          <Route element={<QuestionsPage />} path="panel/:panelId/question" />
          <Route element={<VotingPage />} path="panel/:panelId/voting" />
          <Route element={<TaggingPage />} path="panel/:panelId/tagging" />
        </Route>
        {/* Pages available only to ADMIN */}
        <Route element={<PrivateRoutes isAllowed={user?.role === ADMIN} />}>
          <Route element={<AdminDashboardPage user={user} />} path="admin">
            <Route element={<AdminPanelsPage />} path="panels" />
            <Route element={<AdminGradesPage />} path="grades" />
            <Route element={<AdminUsersPage />} path="users" />
            <Route element={<AdminImportPage />} path="import" />
          </Route>
        </Route>

        {/* Pages available only to PANELIST */}
        {/* <Route element={<PrivateRoutes isAllowed={user?.role === PANELIST} />}>
          <Route element={<Outlet />} path="panelist">
            <Route element={<PanelistPanelsPage />} path="panels" />
            <Route element={<PanelistPanelsPage />} path="panel/:panelId" />
          </Route>
        </Route> */}

        {/* Pages available to ALL the internet */}
        <Route element={<PublicLayout />}>
          <Route element={<LoginPage />} path="login">
            <Route index element={<StudentLoginPage />} />
            {/* <Route element={<PanelLoginPage />} path="panel">
              <Route element={<PanelLoginPage />} path="verify" />
            </Route> */}
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
