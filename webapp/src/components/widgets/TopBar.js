import React from "react";
// MUI
import {
  Avatar,
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
} from "@mui/material";
// Redux
import { useSelector } from "react-redux";
// Enviroment
import { ENV } from "../../config";

const TopBar = () => {
  const { user } = useSelector((state) => state.user);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        // Clearly differentiate from prod and dev environments
        color={ENV === "production" ? "primary" : "secondary"}
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
          {user && (
            <IconButton size="large" color="inherit">
              <Avatar src={user.picture} />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default TopBar;
