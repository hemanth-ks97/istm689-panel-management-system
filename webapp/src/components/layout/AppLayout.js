import React from "react";
// Widgets
import TopBar from "../widgets/TopBar";
import BottomBar from "../widgets/BottomBar";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
  return (
    <>
      <TopBar />
      <Outlet />
      <BottomBar />
    </>
  );
};

export default AppLayout;
