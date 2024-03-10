import React, { useState, useEffect } from "react";
// MUI
import { httpClient } from "../../client";

import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import ListDisplay from "./ListDisplay";
import LoadingSpinner from "./LoadingSpinner";

const PanelList = () => {
  const { user } = useSelector((state) => state.user);
  const [panels, setPanels] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(true);

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
      .catch((error) =>
        enqueueSnackbar(error.message, {
          variant: "error",
        })
      )
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <ListDisplay data={panels} isAdmin={true} idAttributeName="PanelID" />;
};

export default PanelList;
