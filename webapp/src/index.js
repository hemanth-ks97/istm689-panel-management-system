import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { tamuTheme } from "./themes/tamuTheme";
// Store
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";

// Notistack
import { SnackbarProvider } from "notistack";

// Google Provider
import { GoogleOAuthProvider } from "@react-oauth/google";

// Enviroment variables
import { GOOGLE_CLIENT_ID } from "./config";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { Provider } from "react-redux";
import store from "./store";

const persistor = persistStore(store);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SnackbarProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <ThemeProvider theme={tamuTheme}>
                <CssBaseline enableColorScheme />
                <App />
              </ThemeProvider>
            </GoogleOAuthProvider>
          </LocalizationProvider>
        </SnackbarProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
