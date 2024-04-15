import React, { useState, useEffect } from "react";
import { httpClient } from "../../client";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import MaterialTable from "./MaterialTable";
import LoadingSpinner from "./LoadingSpinner";

import {
  DATABASE_ATTRIBUTE_MAPPING,
  firstRowInSCVFile,
} from "../../config/constants";
import { Button } from "@mui/material";
import Papa from "papaparse";

const MetricList = ({ panelId, panelName }) => {
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

  const handleExportClick = () => {
    const data = [firstRowInSCVFile].concat(
      metrics.map((item) => ({
        Student: `${item.UserLName}, ${item.UserFName}`,
        ID: item.id,
        "SIS Login ID": item.uin,
        "Question Stage Score": item.QuestionStageScore,
        "Vote Stage Score": item.VoteStageScore,
        "Tag Stage Score": item.TagStageScore,
      }))
    );
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `${panelName}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <MaterialTable data={metrics} columns={columns} type={"Metric"} />
      <Button onClick={handleExportClick}>Export grades</Button>
    </>
  );
};

export default MetricList;
