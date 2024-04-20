import React from "react";
// MUI
import { Card, CardHeader, Avatar, CardContent } from "@mui/material";

const UserCard = ({ name, email, picture, role = "N/A" }) => {
  return (
    <Card elevation={5}>
      <CardHeader
        avatar={<Avatar src={picture} />}
        title={name}
        subheader={email}
      />
      <CardContent>Role: {role}</CardContent>
    </Card>
  );
};

export default UserCard;
