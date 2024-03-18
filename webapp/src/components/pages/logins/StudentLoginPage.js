import React from "react";
// MUI
import { Grid } from "@mui/material";
// Widgets
import LoginCard from "../../widgets/LoginCard";

const StudentLogin = () => {
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
        <LoginCard />
      </Grid>
    </Grid>
  );
};

export default StudentLogin;
