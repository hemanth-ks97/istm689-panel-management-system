import React from "react";
// MUI
import { Box, CircularProgress, Grid } from "@mui/material";

const LoadingSpinner = ({ fullScren = false }) => {
  if (fullScren) {
    return (
      <Grid
        container
        spacing={0}
        direction="column"
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: "100vh" }}
      >
        <Grid item xs={3}>
          <LoadingSpinner />
        </Grid>
      </Grid>
    );
  }
  return (
    <Box sx={{ display: "flex" }}>
      <CircularProgress />
    </Box>
  );
};

export default LoadingSpinner;
