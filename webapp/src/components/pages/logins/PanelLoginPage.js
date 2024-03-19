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
import { useDispatch } from "react-redux";

import { GoogleReCaptcha } from "react-google-recaptcha-v3";
import { useSnackbar } from "notistack";

import { httpClient } from "../../../client";

import { setUser } from "../../store/slices/userSlice";

const PanelLogin = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [reCaptchaToken, setReCaptchaToken] = useState(null);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const disclaimerText = [
    "Please be advised that this login portal is exclusively designated for authorized panelists. Any attempt by students to access this platform using panelist credentials is strictly prohibited and will be recorded. We maintain a comprehensive log of all login interactions, including but not limited to IP addresses and timestamps.",
    "Unauthorized access to this panelist login is a violation of our terms of use and may result in disciplinary actions. We take the security and integrity of our panel management system seriously, and any unauthorized attempts will be thoroughly investigated.",
    "If you are a student, please use the dedicated student login screen. For panelists experiencing login issues, kindly contact our support team for assistance.",
    "Thank you for your cooperation and understanding.",
  ];

  const handleVerify = (token) => {
    setReCaptchaToken(token);
  };

  const handleSubmit = () => {
    if (!email) {
      enqueueSnackbar("Email is required", { variant: "warning" });
      return;
    }

    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email)) {
      enqueueSnackbar("Invalid email address", { variant: "error" });
      return;
    }

    if (!reCaptchaToken) {
      enqueueSnackbar("Please verify you are not a robot", {
        variant: "error",
      });
      return;
    }

    httpClient
      .post("login/panel", {
        token: reCaptchaToken,
        email,
        callerUrl: window?.location?.href,
      })
      .then(() => {
        // Do nothing on purpose
      })
      .catch(() => {
        // Do nothing on purpose
      })
      .finally(() => {
        // Always send a success message, only users with panelist role will receieve the email
        enqueueSnackbar("An email will be sent ", { variant: "success" });
      });
  };

  if (pathname.endsWith("verify")) {
    let token = null;
    try {
      token = searchParams.get("token");

      dispatch(setUser(token));
      navigate("/");
    } catch (error) {
      console.log("An error occured", error.message);
    }
    return <></>;
  }

  return (
    <>
      <Card sx={{ maxWidth: "650px" }}>
        <CardHeader
          title="Panel Login"
          subheader="Please log in using your registered email"
        />
        <CardContent>
          <FormControl>
            <InputLabel htmlFor="panelist-email">Email address</InputLabel>
            <Input
              id="panelist-email"
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
