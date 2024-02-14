import React from "react";

// Themer & theme
import { CssBaseline, ThemeProvider } from "@mui/material";
import { tamuTheme } from "./themes/tamuTheme";

// Google Provider
import { GoogleOAuthProvider } from "@react-oauth/google";

// Enviroment variables
import { GOOGLE_CLIENT_ID } from "./config";

// Components
import AppLayout from "./components/layout/AppLayout";

import { Provider } from "react-redux";
import store from "./store";

const App = () => {
  return (
    <Provider store={store}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ThemeProvider theme={tamuTheme}>
          <CssBaseline enableColorScheme />
          <AppLayout />
        </ThemeProvider>
      </GoogleOAuthProvider>
    </Provider>
  );
};

export default App;
