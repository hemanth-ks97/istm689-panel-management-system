import { React } from "react";
// MUI
import { Button, ButtonGroup } from "@mui/material";

import { Outlet, useNavigate } from "react-router-dom";

const AdminPage = () => {
  const navigate = useNavigate();

  const options = [
    { displayName: "Panel Management", path: "panels" },
    { displayName: "Grades Management", path: "grades" },
    { displayName: "Users Management", path: "users" },
  ];

  const gridItems = options.map((option) => (
    <Button onClick={() => navigate(option.path)}>{option.displayName}</Button>
  ));

  return (
    <>
      <ButtonGroup>{gridItems}</ButtonGroup>
      <Outlet />
    </>
  );
};

export default AdminPage;
