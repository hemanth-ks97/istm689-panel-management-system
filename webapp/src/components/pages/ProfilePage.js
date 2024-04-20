import React from "react";
// MUI
import { Grid, Typography } from "@mui/material";
// Redux
import { useSelector } from "react-redux";
// Widgets
import UserCard from "../widgets/UserCard";

const ProfilePage = () => {
  const { user } = useSelector((state) => state.user);

  if (!user) {
    return (
      <Grid
        container
        spacing={0}
        direction="column"
        alignItems="center"
        sx={{ minHeight: "100vh" }}
      >
        <Grid spacing={10} item xs={12}>
          <Typography>No user information found</Typography>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      sx={{ minHeight: "100vh" }}
    >
      <Grid spacing={10} item xs={12}>
        <UserCard
          name={user.name}
          email={user.email}
          picture={user.picture}
          role={user.role}
        />
      </Grid>
    </Grid>
  );
};

export default ProfilePage;
