import React, { useState, useEffect } from "react";
import { httpClient } from "../../client";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import MaterialTable from "./MaterialTable";
import LoadingSpinner from "./LoadingSpinner";

import { DATABASE_ATTRIBUTE_MAPPING } from "../../config/constants";

const MetricList = ({ panelId }) => {
  const { user } = useSelector((state) => state.user);
  const [metrics, setMetrics] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(true);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  // fetch the metrics everytime this component is rendered
  useEffect(() => {
    setIsLoading(true);
    httpClient
      .get(`/panel/${panelId}/metrics`, {
        headers: headers,
      })
      .then((response) => {
        setMetrics(response.data);
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

  const columns = Object.keys(DATABASE_ATTRIBUTE_MAPPING.Metric).map((key) => {
    return {
      accessorKey: key,
      header: DATABASE_ATTRIBUTE_MAPPING.Metric[key].displayName,
      size: 200,
    };
  });

  return <MaterialTable data={metrics} columns={columns} type={"Metric"} />;
};

export default MetricList;
