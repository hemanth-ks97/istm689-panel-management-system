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
        API Endpoint: {process.env.REACT_APP_API_SERVER || "not available"}
      </Typography>
    </Box>
  );
};

export default HomePage;
