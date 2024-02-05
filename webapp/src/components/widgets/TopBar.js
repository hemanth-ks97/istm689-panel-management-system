import React from "react";

// Components
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

const TopBar = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="sticky"
        // Clearly differentiate from prod and dev environments
        // TODO: Need to have a config file to better handle this
        color={
          process.env.REACT_APP_ENV === "production" ? "primary" : "secondary"
        }
      >
        <Toolbar>
          <Typography
            color="white"
            variant="h6"
            component="div"
            sx={{ flexGrow: 1 }}
          >
            Panel Management System
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default TopBar;
