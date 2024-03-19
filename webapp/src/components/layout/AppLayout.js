import React from "react";
// Widgets
import TopBar from "../widgets/TopBar";
import { Outlet } from "react-router-dom";
import { Paper, Grid } from "@mui/material";

const AppLayout = () => {
  return (
    <>
      <TopBar />

      {/* <Grid
        container
        spacing={1}
        direction="column"
        alignItems="center"
        sx={{ minHeight: "100vh", maxWidth: "100vh" }}
      >
        <Grid item xs={3}> */}
      {/* Add the centered paper */}
      <Paper elevation={3}>
        <Outlet />
      </Paper>
      {/* </Grid>
      </Grid> */}
    </>
  );
};

export default AppLayout;
