import React from "react";
// MUI

import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

import UserForm from "./UserForm";
import MetricForm from "./MetricForm";
import PanelForm from "./PanelForm";

const EditDialog = ({ isOpen, setIsOpen, selectedData, type }) => {
  const handleClose = () => {
    setIsOpen();
  };

  let form = <></>;

  if (type === "User") {
    form = <UserForm currentUser={selectedData} />;
  }

  if (type === "Panel") {
    form = <PanelForm panel={selectedData} />;
  }
  if (type === "Metric") {
    form = <MetricForm metric={selectedData} />;
  }

  return (
    <>
      <Dialog open={isOpen} onClose={handleClose}>
        <DialogTitle>Edit Record</DialogTitle>
        <DialogContent>
          <DialogContentText>Change the data you need</DialogContentText>
          <br />
          {form}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditDialog;
