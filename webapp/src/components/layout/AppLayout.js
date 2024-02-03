import React from "react";

// MUI
import Container from "@mui/material/Container";

// Components
import HomePage from "../pages/HomePage";
import TopBar from "../widgets/TopBar";

const AppLayout = () => {
  return (
    <>
      <TopBar />
      <Container>
        <HomePage />
      </Container>
    </>
  );
};

export default AppLayout;
