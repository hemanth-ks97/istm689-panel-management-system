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
  List,
  ListItem,
  Drawer,
  Container, 
  Stack
} from "@mui/material";
//Icons
import MenuIcon from '@mui/icons-material/Menu';
// React Router
import { useNavigate } from "react-router-dom";

// Redux
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../../store/slices/userSlice";
// Enviroment
import { ENV } from "../../config";

const drawerWidth = 240;
const nav_buttons = ['Dashboard', 'Questions', 'Voting', 'Grades'];
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

  const settings = [
    {
      name: "Profile",
      handleOnClick: () => {
        navigate("/profile");
        handleClose();
      },
    },
    {
      name: "My account",
      handleOnClick: () => {
        navigate("/");
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
            sx={{ flexGrow: 0.05, fontFamily: 'monospace',
            fontWeight : '800',
            letterSpacing: '.1rem' }}
          >
            Panel Management System
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
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
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {nav_buttons.map((nav_btn) => (
                <MenuItem key={nav_btn} onClick={handleCloseNavMenu}>
                  <Typography textAlign="center">{nav_btn}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {nav_buttons.map((nav_btn) => (
              <Button
                key={nav_btn}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {nav_btn}
              </Button>
            ))}
          </Box>
          {/*
          <Stack display = "flex" spacing={2} direction="row" alignItems="flex-start" sx={{ flexGrow: 1 }}>
            <Button id='btn-dashboard' variant="text" sx={{ color:"white" }}>Dashboard</Button>
            <Button id='btn-questions' variant="text" sx={{ color:"white" }}>Questions</Button>
            <Button id='btn-grades' name='btn-grades' variant="text" sx={{ color:"white" }}>Grades</Button>
          </Stack>
  */}

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
