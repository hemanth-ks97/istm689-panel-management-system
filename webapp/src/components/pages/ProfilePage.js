import React from "react";
// MUI
import { Typography } from "@mui/material";
// Redux
import { useSelector } from "react-redux";
// Widgets
import UserCard from "../widgets/UserCard";

const ProfilePage = () => {
  const { user } = useSelector((state) => state.user);

  return (
    <>
      <Typography>ProfilePage component</Typography>
      {user && (
        <UserCard name={user.name} email={user.email} picture={user.picture} />
      )}
    </>
  );
};

export default ProfilePage;
