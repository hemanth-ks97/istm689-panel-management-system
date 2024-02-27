import React from "react";
// MUI
import { Typography } from "@mui/material";
// Redux
import { useSelector } from "react-redux";

const RenderJSON = () => {
  const { user } = useSelector((state) => state.user);

  if (!user) {
    return <></>;
  }

  return (
    <>
      <p></p>
      <Typography>User Object in browser</Typography>
      <p></p>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </>
  );
};

export default RenderJSON;
