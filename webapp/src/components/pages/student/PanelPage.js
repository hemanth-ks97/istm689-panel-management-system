import React, { useState, useEffect } from "react";

// MUI
import {
  Box,
  Typography,
  Button,
  Divider,
  Link,
  Paper,
  Grid,
} from "@mui/material";
import { useParams, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import { httpClient } from "../../../client";
import LoadingSpinner from "../../widgets/LoadingSpinner";

const PanelPage = () => {
  const { panelId } = useParams();
  const { pathname } = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);
  const [panel, setPanel] = useState(null);

  const menus = [
    {
      title: "Submit Questions",
      path: "question",
      objectKey: "QuestionStageDeadline",
    },
    { title: "Tag Questions", path: "tagging", objectKey: "TagStageDeadline" },
    { title: "Vote Questions", path: "voting", objectKey: "VoteStageDeadline" },
  ];

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  useEffect(() => {
    httpClient
      .get(`/panel/${panelId}`, {
        headers,
      })
      .then((response) => {
        setPanel(response.data);
      })
      .catch((error) =>
        enqueueSnackbar(error.message, {
          variant: "error",
        })
      );
  }, []);

  if (pathname.endsWith("panels")) {
    return (
      <>
        <Typography>Please select a panel</Typography>
        <Button variant="contained" onClick={() => navigate("/")}>
          Go to Dashboard
        </Button>
      </>
    );
  }

  if (!panel) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h5">Panel: {panel.PanelName}</Typography>
        <Typography variant="h6">Description: {panel.PanelDesc}</Typography>
        <Typography variant="h6">Panelist: {panel.Panelist}</Typography>
        <Typography variant="h6">
          Presentation Date: {panel.PanelPresentationDate}
        </Typography>
        <Typography variant="h6">
          Video:{" "}
          <Link
            href={panel.PanelVideoLink}
            underline="hover"
            target="_blank"
            rel="noopener"
          >
            {panel.PanelVideoLink}
          </Link>
        </Typography>
        <br />
        <Divider />
        <br />
        <Grid container spacing={2}>
          {menus.map((menu) => {
            return (
              <Grid item xs={2} md={4}>
                <Paper elevation={3} align="center">
                  <br />
                  <Typography variant="h6">{menu.title}</Typography>
                  <Typography>Deadline {panel[menu.objectKey]}</Typography>
                  <br />
                  <Divider />
                  <br />
                  <Button
                    variant="outlined"
                    onClick={() => navigate(menu.path)}
                  >
                    Go to
                  </Button>
                  <br />
                  <br />
                </Paper>
              </Grid>
            );
          })}

          <Grid item xs={8}>
            <Paper elevation={3} align="center">
              <Outlet />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default PanelPage;
