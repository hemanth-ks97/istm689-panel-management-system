import React, { useState, useEffect } from "react";
import { httpClient } from "../../client";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import MaterialTable from "./MaterialTable";
import LoadingSpinner from "./LoadingSpinner";

import { DATABASE_ATTRIBUTE_MAPPING } from "../../config/constants";
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
    return <LoadingSpinner fullScren />;
  }

  const columns = Object.keys(DATABASE_ATTRIBUTE_MAPPING.Metric).map((key) => {
    return {
      accessorKey: key,
      header: DATABASE_ATTRIBUTE_MAPPING.Metric[key].displayName,
      size: 200,
    };
  });

  const handleExportClick = () => {
    const panelName = metrics[0]?.PanelName || "No Name";

    const exportData = metrics.map((metric) => {
      const {
        UserFName,
        UserLName,
        UserCanvasID,
        UserUIN,
        UserSection,
        QuestionStageScore,
        TagStageScore,
        VoteStageScore,
      } = metric;

      const exportMetric = {};
      exportMetric["Student"] = `${UserFName}, ${UserLName}`;
      exportMetric["ID"] = UserCanvasID;
      exportMetric["SIS Login ID"] = UserUIN;
      exportMetric["Section"] = UserSection;
      // Need to dynamically change the header name!
      exportMetric[`${panelName} - Question Stage`] = QuestionStageScore;
      exportMetric[`${panelName} - Vote Stage`] = VoteStageScore;
      exportMetric[`${panelName} - Tag Stage`] = TagStageScore;

      return exportMetric;
    });

    const canvasCSVHeader = {};
    canvasCSVHeader["Student"] = "    Points Possible";
    canvasCSVHeader["ID"] = null;
    canvasCSVHeader["SIS Login ID"] = null;
    canvasCSVHeader["Section"] = null;
    // Need to dynamically change the header name!
    canvasCSVHeader[`${panelName} - Question Stage`] = 100;
    canvasCSVHeader[`${panelName} - Vote Stage`] = 100;
    canvasCSVHeader[`${panelName} - Tag Stage`] = 100;

    // Insert header to beginning of the array
    exportData.unshift(canvasCSVHeader);

    const csv = Papa.unparse(exportData);
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
      <Button variant="contained" onClick={handleExportClick}>
        Export grades
      </Button>
      <MaterialTable data={metrics} columns={columns} type={"Metric"} />
    </>
  );
};

export default MetricList;
