import React, { useState } from "react";
import { Typography, ButtonGroup, Button } from "@mui/material";

import NewPanelForm from "../../forms/NewPanelForm";
import PanelList from "../../widgets/PanelList";

const AdminPanelsPage = () => {
  const [selectedAction, setSelectedAction] = useState("list");
  return (
    <>
      <br />
      <ButtonGroup>
        <Button onClick={() => setSelectedAction("list")}>
          List all panels
        </Button>
        <Button onClick={() => setSelectedAction("create")}>
          Add new Panel
        </Button>
      </ButtonGroup>

      {selectedAction === "create" && (
        <>
          <Typography>Add a new panel</Typography>
          <NewPanelForm />
        </>
      )}
      {selectedAction === "list" && (
        <>
          <Typography>List Panels</Typography>
          <PanelList />
        </>
      )}
    </>
  );
};

export default AdminPanelsPage;
