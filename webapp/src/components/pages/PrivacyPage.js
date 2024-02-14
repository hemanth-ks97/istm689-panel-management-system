import React from "react";

// MUI
import { Box, Typography } from "@mui/material";

const PrivacyPage = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4">This is the PrivacyPage component.</Typography>
      <Typography>
        Application privacy policy link Provide users a link to your public
        privacy policy
      </Typography>
    </Box>
  );
};

export default PrivacyPage;
