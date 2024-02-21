import React from "react";
// MUI
import { Card, CardHeader, CardContent, Avatar } from "@mui/material";

const UserCard = ({ name, email, picture }) => {
  return (
    <Card elevation={5}>
      <CardHeader
        avatar={<Avatar src={picture} />}
        title={name}
        subheader={email}
      />
    </Card>
  );
};

export default UserCard;
