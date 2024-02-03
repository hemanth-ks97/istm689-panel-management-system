import React from "react";

// Themer & theme
import { CssBaseline, ThemeProvider } from "@mui/material";
import { tamuTheme } from "./themes/tamuTheme";

// Components
import AppLayout from "./components/layout/AppLayout";

const App = () => {
  return (
    <ThemeProvider theme={tamuTheme}>
      <CssBaseline enableColorScheme />
      <AppLayout />
    </ThemeProvider>
  );
};

export default App;
