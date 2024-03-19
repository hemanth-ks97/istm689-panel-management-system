import { React } from "react";
// MUI
import { Button, ButtonGroup, Typography } from "@mui/material";

import { Outlet, useNavigate } from "react-router-dom";

const AdminPage = ({ user }) => {
  const navigate = useNavigate();

  const options = [
    { displayName: "Panel Management", path: "admin/panels" },
    { displayName: "Grades Management", path: "admin/grades" },
    { displayName: "Users Management", path: "admin/users" },
    { displayName: "Import Students", path: "admin/import" },
  ];
  const gridItems = options.map((option) => (
    <Button onClick={() => navigate(option.path)}>{option.displayName}</Button>
  ));

  return (
    <>
      <Typography variant="h4">Admin Dashboard</Typography>
      <ButtonGroup>{gridItems}</ButtonGroup>
      <Outlet />
    </>
  );
};

export default AdminPage;
