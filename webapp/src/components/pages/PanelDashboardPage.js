import { React, useState, useEffect } from "react";
// MUI
import {
  Button,
  ButtonGroup,
  List,
  ListItem,
  ListItemIcon,
  ListItemButton,
  ListItemText,
} from "@mui/material";

import InboxIcon from "@mui/icons-material/Inbox";
import DraftsIcon from "@mui/icons-material/Drafts";

import { Outlet, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import { httpClient } from "../../client";

import { useSelector } from "react-redux";

import LoadingSpinner from "../widgets/LoadingSpinner";

const PanelDashboardPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useSelector((state) => state.user);
  const [panels, setPanels] = useState([]);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  useEffect(() => {
    httpClient
      .get("/panel", {
        headers,
      })
      .then((response) => {
        setPanels(response.data);
      })
      .catch((error) =>
        enqueueSnackbar(error.message, {
          variant: "error",
        })
      );
  }, []);

  // const gridItems = options.map((option) => (
  //   <Button onClick={() => navigate(option.path)}>{option.displayName}</Button>
  // ));

  if (panels.length === 0) {
    return <LoadingSpinner />;
  }

  const listItems = panels.map((panel) => (
    <ListItem disablePadding key={panel.PanelID}>
      <ListItemButton onClick={() => navigate(`/panel/${panel.PanelID}`)}>
        <ListItemText
          primary={panel.PanelName}
          secondary={panel.PanelStartDate}
        />
      </ListItemButton>
    </ListItem>
  ));

  return <List>{listItems}</List>;
};

export default PanelDashboardPage;
