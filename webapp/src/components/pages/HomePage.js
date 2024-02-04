import React from "react";

// MUI
import Box from "@mui/material/Box";

const HomePage = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <p>This is the HomePage component. Autodeploy with custom domain</p>
      Enviroment variable: {process.env.REACT_APP_ENV || "not defined"}
      Git commit: {process.env.REACT_APP_GIT_COMMIT_SHA || "not available"}
    </Box>
  );
};

export default HomePage;
