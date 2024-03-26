import React, { useState, useEffect } from "react";
import { httpClient } from "../../client";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import { DATABASE_ATTRIBUTE_MAPPING } from "../../config/constants";
import MaterialTable from "./MaterialTable";
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

  const columns = Object.keys(DATABASE_ATTRIBUTE_MAPPING.Panel).map((key) => {
    return {
      accessorKey: key,
      header: DATABASE_ATTRIBUTE_MAPPING.Panel[key].displayName,
      size: 200,
    };
  });

  return <MaterialTable data={panels} columns={columns} type={"Panel"} />;
};

export default PanelList;
