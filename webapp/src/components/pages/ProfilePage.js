import React from "react";
// MUI
import { Typography } from "@mui/material";
// Redux
import { useSelector } from "react-redux";
// Widgets
import UserCard from "../widgets/UserCard";
import RenderJSON from "../utils/RenderJSON";

const ProfilePage = () => {
  const { user } = useSelector((state) => state.user);

  return (
    <>
      <Typography variant="h4">ProfilePage component</Typography>
      {user && (
        <UserCard name={user.name} email={user.email} picture={user.picture} />
      )}
      <RenderJSON />
    </>
  );
};

export default ProfilePage;
