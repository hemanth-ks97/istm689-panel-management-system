import React from "react";

// MUI
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const HomePage = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4">This is the HomePage component.</Typography>
      <Typography variant="body2">
        Enviroment: {process.env.REACT_APP_ENV || "not defined"}
      </Typography>

      <Typography variant="body2">
        Git commit: {process.env.REACT_APP_GIT_COMMIT_SHA || "not available"}
      </Typography>
    </Box>
  );
};

export default HomePage;
