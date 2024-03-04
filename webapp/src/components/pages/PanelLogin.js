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

const PanelLogin = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [isVerified, setIsVerified] = useState(false);

  const disclaimerText = [
    "Please be advised that this login portal is exclusively designated for authorized panelists. Any attempt by students to access this platform using panelist credentials is strictly prohibited and will be recorded. We maintain a comprehensive log of all login interactions, including but not limited to IP addresses and timestamps.",
    "Unauthorized access to this panelist login is a violation of our terms of use and may result in disciplinary actions. We take the security and integrity of our panel management system seriously, and any unauthorized attempts will be thoroughly investigated.",
    "If you are a student, please use the dedicated student login screen. For panelists experiencing login issues, kindly contact our support team for assistance.",
    "Thank you for your cooperation and understanding.",
  ];

  const handleVerify = () => {
    enqueueSnackbar("reCaptcha verified", {
      variant: "success",
      preventDuplicate: true,
    });
    setIsVerified(true);
  };

  const handleSubmit = () => {
    enqueueSnackbar("An email will be sent ", { variant: "success" });
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
            <Input id="my-input" aria-describedby="my-helper-text" />
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
            disabled={!isVerified}
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
