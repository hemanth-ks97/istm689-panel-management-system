import React, { useState } from "react";
// MUI
import { Box, Button, Typography, Snackbar } from "@mui/material";
// Router
import { Link } from "react-router-dom";
// Redux
import { useSelector } from "react-redux";
// Enviroment
import { ENV, API_BASE_URL } from "../../config";
// Widgets
import UserCard from "../widgets/UserCard";

import { httpClient } from "../../client";

const HomePage = () => {
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [apiResponse, setApiResponse] = useState("");
  const [isApiWaiting, setIsApiWaiting] = useState(false);

  const { user } = useSelector((state) => state.user);

  const handleOnClick = () => {
    setIsApiWaiting(true);
    httpClient
      .get("/")
      .then((response) =>
        setApiResponse(JSON.stringify(response?.data, null, 2))
      )
      .catch((err) => setApiResponse(JSON.stringify(err.message, null, 2)))
      .finally(() => {
        setIsSnackbarOpen(true);
        setIsApiWaiting(false);
      });
  };

  const handleOnClickPrivate = () => {
    setIsApiWaiting(true);
    httpClient
      .get("/protected", {
        headers: {
          Authorization: `Bearer ${user?.raw_token}`,
          "Content-Type": "application/json",
        },
      })
      .then((response) =>
        setApiResponse(JSON.stringify(response?.data, null, 2))
      )
      .catch((err) => setApiResponse(JSON.stringify(err.message, null, 2)))
      .finally(() => {
        setIsApiWaiting(false);
        setIsSnackbarOpen(true);
      });
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4">This is the HomePage component.</Typography>

      <Link to={"profile"}>Profile</Link>
      <p></p>
      <Link to={"login"}>Login</Link>
      <p></p>

      <Typography variant="body2">
        Enviroment: {ENV || "not defined"}
      </Typography>

      <Typography variant="body2">
        API Endpoint: {API_BASE_URL || "not available"}
      </Typography>
      <p></p>

      <Button
        variant="contained"
        onClick={handleOnClick}
        disabled={isApiWaiting}
      >
        Call Public API
      </Button>

      <Button
        variant="contained"
        onClick={handleOnClickPrivate}
        disabled={isApiWaiting}
      >
        Call Private API
      </Button>

      <p></p>

      {user && (
        <UserCard name={user.name} email={user.email} picture={user.picture} />
      )}
      <Snackbar
        open={isSnackbarOpen}
        onClose={() => setIsSnackbarOpen(false)}
        autoHideDuration={3000}
        message={apiResponse}
      />
    </Box>
  );
};

export default HomePage;
