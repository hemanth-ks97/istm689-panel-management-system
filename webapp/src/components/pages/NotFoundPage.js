import React, { useState, useEffect } from "react";
// MUI
import { Grid, Typography } from "@mui/material";

import { useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const NotFoundPage = () => {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    let token_info = null;
    try {
      token_info = jwtDecode(searchParams.get("token"));
    } catch (error) {}
    setUser(token_info);
  }, []);

  return (
    <>
      <Typography variant="h4">User not found</Typography>
      {user?.email && (
        <Typography variant="h5">You logged using {user.email}</Typography>
      )}

      <Typography>
        Your email address was not found in our authorized list
      </Typography>
      <Typography>
        If you think this is a mistake please contact the professor
      </Typography>
    </>
  );
};

export default NotFoundPage;
