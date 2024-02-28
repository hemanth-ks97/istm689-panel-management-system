import React from "react";
// Widgets
import TopBar from "../widgets/TopBar";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
  return (
    <>
      <TopBar />
      <Outlet />
      {/* <BottomBar /> */}
    </>
  );
};

export default AppLayout;
