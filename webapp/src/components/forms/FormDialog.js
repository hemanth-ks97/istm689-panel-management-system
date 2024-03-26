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

const FormDialog = ({ isOpen, setIsOpen, selectedData }) => {
  const handleClose = () => {
    setIsOpen();
  };

  const entries = Object.keys(selectedData);

  const hello = entries.map((entry) => {
    return (
      <div>
        {entry}: {selectedData[entry]}
      </div>
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
          {/* <TextField
            autoFocus
            required
            margin="dense"
            id="name"
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            variant="standard"
          /> */}
          {hello}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FormDialog;
