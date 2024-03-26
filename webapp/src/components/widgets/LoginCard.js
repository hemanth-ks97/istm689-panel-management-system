import React, { useState } from "react";
// MUI
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  CardActions,
  Grid,
  Divider,
  Typography,
} from "@mui/material";
// Google Login Library
import { GoogleLogin } from "@react-oauth/google";
// Redux
import { useDispatch } from "react-redux";
import { setUser, clearUser } from "../../store/slices/userSlice";
// React Router
import { useNavigate, createSearchParams } from "react-router-dom";
// Import TAMU logo
import tamuLogo from "../../images/tamu-logo.svg";
import { httpClient } from "../../client";
import LoadingSpinner from "../widgets/LoadingSpinner";

const LoginCard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const handleOnSuccess = ({ credential }) => {
    // Receive Google Token and generate a new custom token
    const data = { token: credential };
    setIsLoading(true);

    httpClient
      .post("/login/google", data)
      .then((response) => {
        // Store Google Picture from the initial token
        // Probably need to add to the custom token!
        // Store the pms issued token

        dispatch(setUser(response?.data?.token));

        navigate("/");
      })
      .catch((error) => {
        dispatch(clearUser());
        navigate({
          pathname: "/notfound",
          search: createSearchParams({
            token: credential,
          }).toString(),
        });
      })
      .finally(() => setIsLoading(false));
  };

  const handleOnError = () => {
    console.alert("Login Failed");
    dispatch(clearUser());
  };

  return (
    <Card variant="outlined" sx={{ maxWidth: 345, minWidth: 100 }}>
      <CardMedia
        sx={{ height: 130 }}
        image={tamuLogo}
        component={"img"}
        title="Texas A&M University"
      />
      <CardHeader
        title="Panel Management System"
        subheader="Please login using your TAMU email"
      />
      <CardContent>
        <Typography>Student Login</Typography>
        <Grid
          container
          spacing={0}
          direction="column"
          alignItems="center"
          justifyContent="center"
        >
          <Grid item xs={3}>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <GoogleLogin
                onSuccess={handleOnSuccess}
                onError={handleOnError}
              />
            )}
          </Grid>
        </Grid>
      </CardContent>
      <Divider />
      <CardActions>
        <Grid
          container
          spacing={1}
          direction="column"
          alignItems="center"
          justifyContent="center"
        >
          <Grid item xs={3}>
            <Button variant="outlined" onClick={() => navigate("/login/panel")}>
              Panelist
            </Button>
          </Grid>
        </Grid>
      </CardActions>
    </Card>
  );
};

export default LoginCard;
