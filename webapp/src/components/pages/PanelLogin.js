import React, { useState } from "react";

// MUI
import {
  Card,
  CardHeader,
  FormControl,
  InputLabel,
  Input,
  FormHelperText,
  CardContent,
  CardActionArea,
  Button,
} from "@mui/material";

import { GoogleReCaptcha } from "react-google-recaptcha-v3";
import { useSnackbar } from "notistack";

import { httpClient } from "../../client";

const PanelLogin = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [reCaptchaToken, setReCaptchaToken] = useState(null);
  const [email, setEmail] = useState("");

  const disclaimerText = [
    "Please be advised that this login portal is exclusively designated for authorized panelists. Any attempt by students to access this platform using panelist credentials is strictly prohibited and will be recorded. We maintain a comprehensive log of all login interactions, including but not limited to IP addresses and timestamps.",
    "Unauthorized access to this panelist login is a violation of our terms of use and may result in disciplinary actions. We take the security and integrity of our panel management system seriously, and any unauthorized attempts will be thoroughly investigated.",
    "If you are a student, please use the dedicated student login screen. For panelists experiencing login issues, kindly contact our support team for assistance.",
    "Thank you for your cooperation and understanding.",
  ];

  const handleVerify = (token) => {
    enqueueSnackbar("reCaptcha verified", {
      variant: "success",
      preventDuplicate: true,
    });
    setReCaptchaToken(token);
  };

  const handleSubmit = () => {
    httpClient
      .post("login/panel", { token: reCaptchaToken, email })
      .then((response) => {
        enqueueSnackbar("An email will be sent ", { variant: "success" });
        enqueueSnackbar(JSON.stringify(response.data, null, 2), {
          variant: "info",
        });
      })
      .catch((error) => {
        enqueueSnackbar("An error occured", { variant: "error" });
      });
  };

  return (
    <>
      <Card sx={{ maxWidth: "650px" }}>
        <CardHeader
          title="Panel Login"
          subheader="Please log in using your registered email"
        />
        <CardContent>
          <FormControl>
            <InputLabel htmlFor="my-input">Email address</InputLabel>
            <Input
              id="my-input"
              aria-describedby="my-helper-text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {disclaimerText.map((text, idx) => {
              return (
                <FormHelperText id={`disclamer-text-${idx}`}>
                  {`${idx + 1}) ${text}`}
                </FormHelperText>
              );
            })}
          </FormControl>
        </CardContent>
        <CardActionArea>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!reCaptchaToken}
          >
            Submit
          </Button>
        </CardActionArea>
      </Card>
      <GoogleReCaptcha onVerify={handleVerify} />
    </>
  );
};

export default PanelLogin;