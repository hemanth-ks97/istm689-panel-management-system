import React, { useState } from "react";
// MUI

import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

import { DATABASE_ATTRIBUTE_MAPPING } from "../../config/constants";

const SomeDialog = ({ isOpen, setIsOpen, selectedData, type }) => {
  const handleClose = () => {
    setIsOpen();
  };

  const recordAttributes = Object.keys(DATABASE_ATTRIBUTE_MAPPING[type]);
  console.log(recordAttributes);
  console.log(type);

  const formFields = recordAttributes.map((entry, idx) => {
    return (
      <TextField
        margin="dense"
        id={idx}
        name={entry}
        label={DATABASE_ATTRIBUTE_MAPPING[type]?.[entry]?.displayName}
        type={DATABASE_ATTRIBUTE_MAPPING[type]?.[entry]?.type}
        fullWidth
        value={selectedData[entry]}
        variant="standard"
      />
    );
  });

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={handleClose}
        PaperProps={{
          component: "form",
          onSubmit: (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries(formData.entries());
            const email = formJson.email;
            console.log(email);
            handleClose();
          },
        }}
      >
        <DialogTitle>Edit Record</DialogTitle>
        <DialogContent>
          <DialogContentText>Change the data you need</DialogContentText>
          {formFields}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SomeDialog;
