import React from "react";

// MUI
import Container from "@mui/material/Container";

// Components
import HomePage from "../pages/HomePage";
import TopBar from "../widgets/TopBar";
import { Route, Routes } from "react-router-dom";
import ProfilePage from "../pages/ProfilePage";

const AppLayout = () => {
  return (
    <>
      <TopBar />
      <Container>
      <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Container>
    </>
  );
};

export default AppLayout;
