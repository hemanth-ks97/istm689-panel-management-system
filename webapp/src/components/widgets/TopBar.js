import React, { useState } from "react";
// MUI
import {
  Avatar,
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Button,
} from "@mui/material";
//Icons
import MenuIcon from "@mui/icons-material/Menu";
// React Router
import { useNavigate } from "react-router-dom";

// Redux
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../../store/slices/userSlice";
// Enviroment
import { ENV } from "../../config";

const TopBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const { user } = useSelector((state) => state.user);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const navigationOptions = [
    {
      name: "Dashboard",
      handleOnClick: () => {
        navigate("/");
        handleCloseNavMenu();
      },
    },
    // {
    //   name: "Questions",
    //   handleOnClick: () => {
    //     navigate("/questions");
    //     handleCloseNavMenu();
    //   },
    // },
    // {
    //   name: "Voting",
    //   handleOnClick: () => {
    //     navigate("/voting");
    //     handleCloseNavMenu();
    //   },
    // },
    {
      name: "Panels",
      handleOnClick: () => {
        navigate("/panels");
        handleCloseNavMenu();
      },
    },
    {
      name: "Grades",
      handleOnClick: () => {
        navigate("/grades");
        handleCloseNavMenu();
      },
    },
  ];

  const settings = [
    {
      name: "Profile",
      handleOnClick: () => {
        navigate("/profile");
        handleClose();
      },
    },
    {
      name: "Logout",
      handleOnClick: () => {
        dispatch(clearUser());
        handleClose();
      },
    },
  ];

  if (user.role === "admin") {
    settings.unshift({
      name: "Admin",
      handleOnClick: () => {
        navigate("/admin");
        handleClose();
      },
    });
  }

  return (
    <Box>
      <AppBar
        position="static"
        // Clearly differentiate from prod and dev environments
        color={ENV === "production" ? "primary" : "secondary"}
      >
        <Toolbar disableGutters>
          <Typography
            color="white"
            variant="h6"
            component="div"
            sx={{
              flexGrow: 0.05,
              fontFamily: "monospace",
              fontWeight: "800",
              letterSpacing: ".1rem",
            }}
          >
            Panel Management System
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: "block", md: "none" },
              }}
            >
              {navigationOptions.map((option, idx) => (
                <MenuItem key={idx} onClick={option.handleOnClick}>
                  <Typography textAlign="center">{option.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {navigationOptions.map((option, idx) => (
              <Button
                key={idx}
                onClick={option.handleOnClick}
                sx={{ my: 2, color: "white", display: "block" }}
              >
                {option.name}
              </Button>
            ))}
          </Box>

          {user && (
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar src={user.picture} />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                {settings.map((setting) => (
                  <MenuItem key={setting.name} onClick={setting.handleOnClick}>
                    <Typography textAlign="center">{setting.name}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </div>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default TopBar;
