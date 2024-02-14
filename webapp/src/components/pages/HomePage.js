import React from "react";
// MUI
import { Box, Typography } from "@mui/material";
// Router
import { Link } from "react-router-dom";
// Redux
import { useSelector } from "react-redux";
// Enviroment
import { ENV, API_SERVER } from "../../config";
// Widgets
import UserCard from "../widgets/UserCard";

const HomePage = () => {
  const { user } = useSelector((state) => state.user);

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
        API Endpoint: {API_SERVER || "not available"}
      </Typography>

      {user && (
        <UserCard name={user.name} email={user.email} picture={user.picture} />
      )}
    </Box>
  );
};

export default HomePage;
