import { React, useState, useEffect } from "react";
// MUI
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import { httpClient } from "../../../client";

import LoadingSpinner from "../../widgets/LoadingSpinner";

const PanelDashboardPage = ({ user }) => {
  const [panels, setPanels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  useEffect(() => {
    setIsLoading(true);
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
      )
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!panels || panels.length === 0) {
    return <Typography>Did not find any panels</Typography>;
  }

  const listItems = panels.map((panel) => (
    <ListItem disablePadding key={panel.PanelID}>
      <ListItemButton
        onClick={() => navigate(`/panelist/panel/${panel.PanelID}`)}
      >
        <ListItemText
          primary={panel.PanelName}
          secondary={panel.PanelStartDate}
        />
      </ListItemButton>
    </ListItem>
  ));

  return (
    <>
      <Typography color={"red"}>
        Will return panels associated with this panelist
      </Typography>
      <List>{listItems}</List>
    </>
  );
};

export default PanelDashboardPage;
