import React from "react";

// MUI
import { Typography, Card, CardHeader, Avatar } from "@mui/material";
// Redux
import { useSelector } from "react-redux";

const UserCard = ({ name, email, picture }) => {
  const { user } = useSelector((state) => state.user);
  return (
    <>
      <Card>
        <CardHeader
          avatar={<Avatar src={picture} />}
          title={name}
          subheader={email}
        />
      </Card>
      <p></p>
      <Typography>Decoded Token:</Typography>
      <p></p>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </>
  );
};

export default UserCard;
