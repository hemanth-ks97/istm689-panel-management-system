import React from "react";

// Themer & theme
import { CssBaseline, ThemeProvider } from "@mui/material";
import { tamuTheme } from "./themes/tamuTheme";
import { BrowserRouter } from "react-router-dom";

// Components
import AppLayout from "./components/layout/AppLayout";

const App = () => {
  return (
    <ThemeProvider theme={tamuTheme}>
      <CssBaseline enableColorScheme />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
