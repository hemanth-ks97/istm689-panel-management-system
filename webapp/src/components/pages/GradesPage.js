import React from "react";
// MUI
import { Box, Typography } from "@mui/material";
import UploadFileCard from "../widgets/UploadFileCard";
const GradesPage = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography mt={2} variant="h4">
        This is the GradesPage component.
      </Typography>
      <Typography mt={3} mb={2} variant="h5">
        Test for Howdy Upload file
      </Typography>
      <UploadFileCard />
    </Box>
  );
};

export default GradesPage;
