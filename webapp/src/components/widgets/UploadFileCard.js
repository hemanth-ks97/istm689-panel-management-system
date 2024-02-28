import React, { useState } from "react";

import { useSnackbar } from "notistack";

// HTTP Client
import { httpClient } from "../../client";
import { useSelector } from "react-redux";
// MUI
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import { Button } from "@mui/material";

import { styled } from "@mui/material/styles";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const UploadFileCard = () => {
  const { user } = useSelector((state) => state.user);
  const { enqueueSnackbar } = useSnackbar();

  const [isApiWaiting, setIsApiWaiting] = useState(false);

  const sendCSVToServer = (csvData) => {
    setIsApiWaiting(true);
    httpClient
      .post("/howdycsv", csvData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "text/plain",
        },
      })
      .then((response) => {
        enqueueSnackbar(JSON.stringify(response?.data?.message), {
          variant: "success",
        });
      })
      .catch((err) =>
        enqueueSnackbar(err.message, {
          variant: "error",
        })
      )
      .finally(() => setIsApiWaiting(false));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvData = e.target.result;
        sendCSVToServer(csvData);
        event.target.value = "";
      };
      reader.readAsText(file);
    }
  };

  return (
    <Button
      component="label"
      role={undefined}
      variant="contained"
      tabIndex={-1}
      disabled={isApiWaiting}
      startIcon={<CloudUploadIcon />}
    >
      Upload file
      <VisuallyHiddenInput type="file" onChange={handleFileChange} />
    </Button>
  );
};

export default UploadFileCard;
