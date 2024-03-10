import React, { useState, useEffect } from "react";

// MUI
import { Box, Typography, Button, ButtonGroup } from "@mui/material";
import { useParams, Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import { httpClient } from "../../client";
import LoadingSpinner from "../widgets/LoadingSpinner";

const PanelPage = () => {
  const { panelId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useSelector((state) => state.user);
  const [panel, setPanel] = useState(null);

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

  if (!panel) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4">PanelPage Component</Typography>
        <Typography>Panel ID: {panelId}</Typography>
        <Typography>Raw Panel info</Typography>
        <Typography>{JSON.stringify(panel, null, 2)}</Typography>

        <ButtonGroup>
          <Button variant="outlined" onClick={() => navigate("question")}>
            Submit Questions
          </Button>

          <Button variant="outlined" onClick={() => navigate("tagging")}>
            Tag Questions
          </Button>

          <Button variant="outlined" onClick={() => navigate("voting")}>
            Vote Questions
          </Button>
          <Button variant="outlined" onClick={() => navigate("questions")}>
            DRAFT: All questions for this Panel
          </Button>
        </ButtonGroup>

        <Outlet />
      </Box>
    </>
  );
};

export default PanelPage;
