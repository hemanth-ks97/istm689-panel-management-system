import React, { useState, useEffect } from "react";
import { httpClient } from "../../client";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import MaterialTable from "./MaterialTable";
import LoadingSpinner from "./LoadingSpinner";

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

  const columns = [
    { accessorKey: "PanelID", header: "ID", size: 200 },
    { accessorKey: "UserID", header: "User ID", size: 200 },
    { accessorKey: "QuestionStageScore", header: "Questions Score", size: 200 },
    { accessorKey: "TagStageScore", header: "Tag Score", size: 200 },
    { accessorKey: "VoteStageScore", header: "Vote Score", size: 200 },
    { accessorKey: "FinalTotalScore", header: "Final Score", size: 200 },
    {
      accessorKey: "EnteredQuestionsTotalScore",
      header: "Entered Questions Score",
      size: 200,
    },
    { accessorKey: "TagStageInTime", header: "Tag In Time", size: 200 },
    { accessorKey: "TagStageOutTime", header: "Tag Out Time", size: 200 },
    { accessorKey: "TagStageSD", header: "Tag Standard Deviation", size: 200 },
    {
      accessorKey: "VoteStageSD",
      header: "Vote Standard Deviation",
      size: 200,
    },
    { accessorKey: "VoteStageInTime", header: "Vote In Time", size: 200 },
    { accessorKey: "VoteStageOutTime", header: "Vote Out Time", size: 200 },
    { accessorKey: "CreatedAt", header: "CreatedAt", size: 200 },
  ];

  return <MaterialTable data={metrics} columns={columns} />;
};

export default MetricList;
