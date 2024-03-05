import React from "react";
import PanelForm from "../forms/PanelForm";
// MUI
import { Box, Typography, Button } from "@mui/material";
import { useParams, Outlet, useNavigate } from "react-router-dom";

const PanelPage = () => {
  const { panelId } = useParams();
  const navigate = useNavigate();

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4">PanelPage Component</Typography>
        <Typography>Panel ID: {panelId}</Typography>

        <Button variant="contained" onClick={() => navigate("questions")}>
          Submit Questions
        </Button>
        <p></p>
        <Button variant="contained" onClick={() => navigate("tagging")}>
          Tag Questions
        </Button>
        <p></p>

        <Button variant="contained" onClick={() => navigate("voting")}>
          Vote Questions
        </Button>
        <p></p>

        <Outlet />
      </Box>
    </>
  );
};

export default PanelPage;
