import { React } from "react";
// MUI
import { Button, ButtonGroup, Typography } from "@mui/material";

import { Outlet, useNavigate, useLocation } from "react-router-dom";

const AdminPage = ({ user }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const options = [
    { displayName: "Panel Management", path: "/admin/panels" },
    { displayName: "Grades Management", path: "/admin/grades" },
    { displayName: "Users Management", path: "/admin/users" },
    { displayName: "Import Students", path: "/admin/import" },
  ];
  const gridItems = options.map((option) => (
    <Button
      disabled={option.path === pathname}
      onClick={() => navigate(option.path)}
    >
      {option.displayName}
    </Button>
  ));

  return (
    <>
      <Typography variant="h4">Admin Dashboard</Typography>
      <Typography variant="h5">Welcome back {user?.name}!</Typography>
      <ButtonGroup>{gridItems}</ButtonGroup>
      <Outlet />
    </>
  );
};

export default AdminPage;
