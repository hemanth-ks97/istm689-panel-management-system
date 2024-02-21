import React from "react";
// MUI
import { Grid } from "@mui/material";
// React Router
import { Outlet } from "react-router-dom";

const PublicLayout = () => {
  return (
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      justifyContent="center"
      color="red"
      sx={{ minHeight: "100vh" }}
      style={{ color: "white", backgroundColor: "#500000" }}
    >
      <Grid item xs={3}>
        <Outlet />
      </Grid>
    </Grid>
  );
};

export default PublicLayout;
