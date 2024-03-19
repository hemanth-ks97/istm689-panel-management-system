import { React, useState, useEffect } from "react";
// MUI
import { List, ListItem, ListItemButton, ListItemText } from "@mui/material";

import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import { httpClient } from "../../../client";

import { useSelector } from "react-redux";

import LoadingSpinner from "../../widgets/LoadingSpinner";

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

  if (!panels || panels.length === 0) {
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
