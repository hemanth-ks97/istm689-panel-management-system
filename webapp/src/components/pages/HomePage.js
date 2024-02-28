import React, { useState } from "react";
// MUI
import { Box, Typography, Snackbar } from "@mui/material";

import UploadFileCard from "../widgets/UploadFileCard";

const HomePage = () => {
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [apiResponse, setApiResponse] = useState("");

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4">This is the HomePage component.</Typography>
      <UploadFileCard />
      <Snackbar
        open={isSnackbarOpen}
        onClose={() => setIsSnackbarOpen(false)}
        autoHideDuration={3000}
        message={apiResponse}
      />
    </Box>
  );
};

export default HomePage;
