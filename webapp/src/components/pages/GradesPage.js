import React, { useState } from "react";
// MUI
import { Box, Button, Typography, Snackbar, Paper, Table, 
  TableBody, TableCell, TableContainer, TableRow, TableHead, styled } from "@mui/material";
// Redux
import { useSelector } from "react-redux";
// HTTP Client
import { httpClient } from "../../client";

const GradesPage = () => {
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [apiResponse, setApiResponse] = useState("");
  const [isApiWaiting, setIsApiWaiting] = useState(false);
  const [selectedHowdyFile, SetSelectedHowdyFile] = useState("");

  const { user } = useSelector((state) => state.user);
  
  const sendCSVToServer = (csvData) => {
    setIsApiWaiting(true);
    httpClient
      .post("/howdycsv", csvData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "text/plain",
        },
      })
      .then((response) =>
        setApiResponse(JSON.stringify(response?.data, null, 2))
      )
      .catch((err) => setApiResponse(JSON.stringify(err.message, null, 2)))
      .finally(() => {
        setIsApiWaiting(false);
        setIsSnackbarOpen(true);
      });
  };
  
  const handleHowdyCSVUpload = () => {
    if (selectedHowdyFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvData = e.target.result;
        sendCSVToServer(csvData);
      };
      reader.readAsText(selectedHowdyFile);
    }
  };
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      SetSelectedHowdyFile(file);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography mt={2} variant="h4">This is the GradesPage component.</Typography>
      <Typography mt={3} mb={2} variant="h5">Test for Howdy Upload file</Typography>
      <>
        <input type="file" onChange={handleFileChange} />
        <Button
          variant="contained"
          onClick={handleHowdyCSVUpload}
          disabled={isApiWaiting}
        >
          Upload Howdy CSV
        </Button>
      </>

      <Snackbar
        open={isSnackbarOpen}
        onClose={() => setIsSnackbarOpen(false)}
        autoHideDuration={3000}
        message={apiResponse}
      />
    </Box>
  );
};

export default GradesPage;
