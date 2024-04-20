import React from "react";
// MUI
import { Button, Grid, Typography } from "@mui/material";
import { useNavigate } from "react-router";

import ErrorIcon from "@mui/icons-material/Error";

const ErrorMessage = ({
  message = "An unexpected error occurred",
  showReloadOption = false,
}) => {
  const navigate = useNavigate();

  const refreshPage = () => {
    navigate(0);
  };

  return (
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      sx={{ minHeight: "100vh" }}
    >
      <Grid item xs={12}>
        <ErrorIcon color="error" sx={{ fontSize: 100 }} />
      </Grid>
      <Grid item xs={12} spacing={10}>
        <Typography>{message}</Typography>
      </Grid>

      {showReloadOption && (
        <Grid item xs={12}>
          <Button variant="outlined" onClick={refreshPage}>
            Reload
          </Button>
        </Grid>
      )}
    </Grid>
  );
};

export default ErrorMessage;
