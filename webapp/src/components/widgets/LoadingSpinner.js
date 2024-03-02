import React from "react";
// MUI
import { Box, CircularProgress } from "@mui/material";

const LoadingSpinner = () => {
  return (
    <Box sx={{ display: "flex" }}>
      <CircularProgress />
    </Box>
  );
};

export default LoadingSpinner;
