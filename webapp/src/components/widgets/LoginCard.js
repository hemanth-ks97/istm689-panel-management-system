import React from "react";
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
import { useNavigate } from "react-router-dom";
// Import TAMU logo
import tamuLogo from "../../images/tamu-logo.svg";
import { httpClient } from "../../client";

const LoginCard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleOnSuccess = ({ credential }) => {
    dispatch(setUser(credential));

    // Turn ON LOADING SCREEN

    const data = { token: credential };

    httpClient.post("/token/create", data).then((response) => {
      console.log("Response", JSON.stringify(response));
    });

    // Redirect to home page after succesfull login
    navigate("/");
  };

  const handleOnError = () => {
    console.alert("Login Failed");
    dispatch(clearUser());
  };

  return (
    <Card variant="outlined" sx={{ maxWidth: 345, minWidth: 100 }}>
      <CardMedia
        sx={{ height: 140 }}
        image={tamuLogo}
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
            <GoogleLogin onSuccess={handleOnSuccess} onError={handleOnError} />
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
            <Button variant="outlined">Panelist</Button>
          </Grid>
        </Grid>
      </CardActions>
    </Card>
  );
};

export default LoginCard;
