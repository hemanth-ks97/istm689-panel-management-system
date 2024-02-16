import React from "react";
// MUI
import { Box, Button, Typography } from "@mui/material";
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
  const { user } = useSelector((state) => state.user);

  const handleOnClick = () => {
    httpClient
      .get("/")
      .then((response) => {
        console.log(response);
        alert(JSON.stringify(response?.data, null, 2));
      })
      .catch((err) => console.log(err));
  };

  const handleOnClickPrivate = () => {
    httpClient
      .get("/protected", {
        headers: {
          Authorization: `Bearer ${user?.raw_token}`,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        console.log(response);
        alert(JSON.stringify(response?.data, null, 2));
      })
      .catch((err) => console.log(err));
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

      <Button variant="contained" onClick={handleOnClick}>
        Call Public API
      </Button>

      <Button variant="contained" onClick={handleOnClickPrivate}>
        Call Private API
      </Button>

      <p></p>

      {user && (
        <UserCard name={user.name} email={user.email} picture={user.picture} />
      )}
    </Box>
  );
};

export default HomePage;
