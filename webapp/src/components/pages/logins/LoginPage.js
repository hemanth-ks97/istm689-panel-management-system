import React from "react";

import { Outlet } from "react-router-dom";

import { GOOGLE_RECAPTCHA_KEY } from "../../../config";

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

const LoginPage = () => {
  // Maybe we set the common layout for login page here
  return (
    <GoogleReCaptchaProvider reCaptchaKey={GOOGLE_RECAPTCHA_KEY}>
      <Outlet />
    </GoogleReCaptchaProvider>
  );
};

export default LoginPage;
