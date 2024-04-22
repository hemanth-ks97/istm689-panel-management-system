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

      {selectedAction === "create" && <NewPanelForm />}
      {selectedAction === "list" && <PanelList />}
    </>
  );
};

export default AdminPanelsPage;
