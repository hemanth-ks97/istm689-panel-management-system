import React from "react";
import { useSelector } from "react-redux";
import { Typography } from "@mui/material";

import AdminDashboardPage from "./AdminDashboardPage";
import StudentDashboardPage from "./StudentDashboardPage";
import PanelDashboardPage from "./PanelDashboardPage";

import { STUDENT, ADMIN, PANELIST } from "../../../config/constants";

const DashboardPage = () => {
  const { user } = useSelector((state) => state.user);
  let output;

  switch (user?.role) {
    case STUDENT:
      output = <StudentDashboardPage user={user} />;
      break;
    case ADMIN:
      output = <AdminDashboardPage user={user} />;
      break;
    case PANELIST:
      output = <PanelDashboardPage user={user} />;
      break;
    default:
      output = (
        <Typography>
          We are sorry you are seeing this page, please contact the support team
        </Typography>
      );
      break;
  }

  return output;
};

export default DashboardPage;
