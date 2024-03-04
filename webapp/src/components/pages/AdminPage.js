import { React, useEffect, useState } from "react";
// MUI
import { Box, Typography, CircularProgress } from "@mui/material";
import { httpClient } from "../../client";
import { useSnackbar } from "notistack";
// Redux
import { useSelector } from "react-redux";
import PanelDisplay from "../widgets/PanelDisplay";
const AdminPage = () => {
  const [panels, setPanels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useSelector((state) => state.user);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  // fetch the panels everytime this component is rendered 
  useEffect(() => {
    setIsLoading(true);
    httpClient
      .get("/panel", {
        headers: headers,
      })
      .then((response) => {
        setPanels(response.data);
      })
      .catch((error) => enqueueSnackbar(error.message, { variant: "Failed to retrieve panel information" }))
      .finally(() => setIsLoading(false));

  }, [])

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4">This is the AdminPage component. You are Dr Gomillion. Only you should see this page</Typography>
      {isLoading && <CircularProgress />}
      {!isLoading && <PanelDisplay data = {panels} isAdmin={true}/>}
    </Box>
  );
};

export default AdminPage;
